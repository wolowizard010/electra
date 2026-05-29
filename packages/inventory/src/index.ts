import { db } from '@electra/db';

/**
 * Checks stock availability without acquiring locks.
 * Useful for cart views or preliminary checkout checks.
 */
export async function checkStockAvailability(productId: string, quantity: number): Promise<boolean> {
  const item = await db.inventoryItem.findUnique({
    where: { productId },
  });
  if (!item) return false;
  return (item.quantity - item.reserved) >= quantity;
}

/**
 * Reserves inventory for a checkout session.
 * MUST be run inside a Prisma Transaction ($transaction) to ensure safety.
 * Acquires a write lock (SELECT ... FOR UPDATE) on the specific inventory row.
 */
export async function reserveStock(tx: any, productId: string, quantity: number): Promise<boolean> {
  // 1. Acquire PostgreSQL Row-Level Write Lock (FOR UPDATE)
  const items: any[] = await tx.$queryRaw`
    SELECT * FROM "InventoryItem" 
    WHERE "productId" = ${productId} 
    FOR UPDATE
  `;

  if (!items || items.length === 0) {
    return false;
  }

  const inventoryItem = items[0];
  const availableStock = inventoryItem.quantity - inventoryItem.reserved;

  // 2. Check if enough stock exists
  if (availableStock < quantity) {
    return false;
  }

  // 3. Increment reservation count
  await tx.inventoryItem.update({
    where: { productId },
    data: {
      reserved: { increment: quantity },
    },
  });

  return true;
}

/**
 * Releases previously reserved stock back to available stock.
 * Used if checkout fails, payment is declined, or order is cancelled before shipping.
 */
export async function releaseStock(tx: any, productId: string, quantity: number): Promise<boolean> {
  await tx.inventoryItem.update({
    where: { productId },
    data: {
      reserved: { decrement: quantity },
    },
  });
  return true;
}

/**
 * Commits a reservation. Deducts physical quantity and reserved quantity.
 * Used when an order is finalized and shipping label is prepared/shipped.
 */
export async function commitReservation(tx: any, productId: string, quantity: number): Promise<void> {
  await tx.inventoryItem.update({
    where: { productId },
    data: {
      quantity: { decrement: quantity },
      reserved: { decrement: quantity },
    },
  });
}

/**
 * Updates physical stock counts and locations in the warehouse.
 * Restricted to warehouse operators or system admin scripts.
 */
export async function updateWarehouseStock(productId: string, quantity: number, location: string): Promise<void> {
  await db.inventoryItem.upsert({
    where: { productId },
    create: {
      productId,
      quantity,
      reserved: 0,
      location,
    },
    update: {
      quantity,
      location,
    },
  });
}
