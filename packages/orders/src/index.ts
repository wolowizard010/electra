import { db } from '@electra/db';
import { reserveStock, releaseStock, commitReservation } from '@electra/inventory';
import { createRazorpayOrder, verifyRazorpaySignature } from '@electra/payments';
import { sendOrderInvoice } from '@electra/notifications';
import crypto from 'crypto';

export interface CheckoutSessionResult {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  totalItemsPrice: number;
  shippingCost: number;
  taxCost: number;
}

const SHIPPING_FLAT_RATE = 15.00;
const TAX_RATE = 0.10; // 10%

/**
 * Stage 1: Initiates checkout session.
 * Fetches user's cart, reserves catalog stock inside a database transaction, 
 * and registers the order with Razorpay outside the transaction.
 */
export async function initiateCheckout(userId: string): Promise<CheckoutSessionResult> {
  // 1. Fetch Cart and check contents
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error('Checkout failed: Cart is empty');
  }

  // 2. Compute prices
  let totalItemsPrice = 0;
  for (const item of cart.items) {
    totalItemsPrice += parseFloat(item.product.price.toString()) * item.quantity;
  }
  
  const taxCost = totalItemsPrice * TAX_RATE;
  const totalAmount = totalItemsPrice + SHIPPING_FLAT_RATE + taxCost;

  // 3. Database transaction to reserve stock
  await db.$transaction(async (tx) => {
    for (const item of cart.items) {
      const reserved = await reserveStock(tx, item.productId, item.quantity);
      if (!reserved) {
        throw new Error(`Checkout failed: Insufficient stock for product ${item.product.name} (SKU: ${item.product.sku})`);
      }
    }
  });

  // 4. Generate Razorpay Order outside the database transaction
  const rzpOrder = await createRazorpayOrder(totalAmount, 'USD');

  return {
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    totalItemsPrice,
    shippingCost: SHIPPING_FLAT_RATE,
    taxCost,
  };
}

/**
 * Stage 2: Confirms checkout.
 * Verifies Razorpay payment signature. 
 * - If valid: finalizes order creation, commits reserved stock, clears cart.
 * - If invalid: releases reserved stock back to inventory.
 */
export async function confirmCheckout(
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  shippingAddressId: string
): Promise<any> {
  const verified = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  // Retrieve user cart to get items list for commit or rollback
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error('Checkout confirmation failed: Cart is empty');
  }

  if (!verified) {
    // Stage 4: Payment failed, release reservations
    await db.$transaction(async (tx) => {
      for (const item of cart.items) {
        await releaseStock(tx, item.productId, item.quantity);
      }
    });
    throw new Error('Checkout confirmation failed: Cryptographic signature mismatch');
  }

  // Calculate pricing values
  let totalItemsPrice = 0;
  for (const item of cart.items) {
    totalItemsPrice += parseFloat(item.product.price.toString()) * item.quantity;
  }
  const taxCost = totalItemsPrice * TAX_RATE;
  const totalAmount = totalItemsPrice + SHIPPING_FLAT_RATE + taxCost;

  const orderNumber = 'ELEC-' + crypto.randomInt(100000, 999999).toString();

  // Stage 3: Payment succeeded, commit records
  const order = await db.$transaction(async (tx) => {
    // 1. Create paid Order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        shippingAddressId,
        status: 'PAID',
        totalItemsPrice,
        shippingCost: SHIPPING_FLAT_RATE,
        taxCost,
        totalAmount,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            pricePaid: item.product.price,
          })),
        },
        transactions: {
          create: {
            gateway: 'Razorpay',
            transactionId: razorpayPaymentId,
            amount: totalAmount,
            status: 'succeeded',
          },
        },
        shipments: {
          create: {
            destinationAddressId: shippingAddressId,
            carrier: 'FedEx',
            status: 'LABEL_CREATED',
          },
        },
      },
      include: {
        items: { include: { product: true } },
        shipments: true,
        transactions: true,
      },
    });

    // 2. Commit stock reservation (reserved -> physical deduction)
    for (const item of cart.items) {
      await commitReservation(tx, item.productId, item.quantity);
    }

    // 3. Clear customer cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return newOrder;
  });

  // Trigger customer invoice email asynchronously
  const user = await db.user.findUnique({
    where: { id: userId },
  });
  if (user) {
    sendOrderInvoice(user.email, {
      orderNumber: order.orderNumber,
      customerName: `${user.firstName} ${user.lastName}`,
      items: order.items.map((item: any) => ({
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: parseFloat(item.pricePaid.toString()),
      })),
      totalItemsPrice: parseFloat(order.totalItemsPrice.toString()),
      shippingCost: parseFloat(order.shippingCost.toString()),
      taxCost: parseFloat(order.taxCost.toString()),
      totalAmount: parseFloat(order.totalAmount.toString()),
    }).catch((err) => console.error('Invoice dispatch failed:', err));
  }

  return order;
}
