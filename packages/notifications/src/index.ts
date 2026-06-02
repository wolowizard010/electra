import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

/**
 * Sends a generic HTML email using Gmail.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.warn('EMAIL_USER or EMAIL_PASS is not set. Falling back to local simulated email.');
      // 1. Create simulated delivery directory in the workspace
      const mailDir = path.join(process.cwd(), 'local_emails');
      if (!fs.existsSync(mailDir)) {
        fs.mkdirSync(mailDir, { recursive: true });
      }

      const emailId = crypto.randomBytes(4).toString('hex');
      const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const fileName = `email_${emailId}_to_${to.replace('@', '_at_')}_subj_${safeSubject}.html`;
      const filePath = path.join(mailDir, fileName);

      // 2. Write file
      const content = `
        <!--
          SIMULATED EMAIL TRANSMISSION RECEIPT
          TO: ${to}
          SUBJECT: ${subject}
          TIMESTAMP: ${new Date().toISOString()}
        -->
        ${html}
      `;
      fs.writeFileSync(filePath, content, 'utf8');

      console.log(`[EMAIL DISPATCH] Sent to: ${to} | Subject: "${subject}" | Saved receipt: local_emails/${fileName}`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Electra Private Ltd." <${user}>`,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL DISPATCH] Sent real email to: ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Failed to dispatch email:', error);
    return false;
  }
}

/**
 * Sends a premium HTML Invoice email to the customer post-payment success.
 */
export async function sendOrderInvoice(
  email: string,
  details: {
    orderNumber: string;
    customerName: string;
    items: { name: string; sku: string; quantity: number; price: number }[];
    totalItemsPrice: number;
    shippingCost: number;
    taxCost: number;
    totalAmount: number;
  }
): Promise<boolean> {
  const subject = `Electra Order Confirmation - ${details.orderNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="background-color: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; margin: 0;">
      <div style="max-w: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
        
        <!-- Logo/Header -->
        <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 24px; mb-24px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #3b82f6; letter-spacing: -0.025em;">ELECTRA</h1>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; uppercase; letter-spacing: 0.1em;">Order Receipt</p>
        </div>

        <!-- Receipt Metadata -->
        <div style="margin: 24px 0; font-size: 14px;">
          <p style="margin: 4px 0;"><strong>Hello ${details.customerName},</strong></p>
          <p style="margin: 4px 0; color: #94a3b8;">Thank you for your purchase. Your payment was verified, and your order has been placed into our packaging queue.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Order Number:</td>
            <td style="padding: 6px 0; text-align: right; color: #f8fafc; font-family: monospace; font-weight: bold; font-size: 13px;">${details.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Payment Status:</td>
            <td style="padding: 6px 0; text-align: right; color: #34d399; font-weight: bold; font-size: 13px;">PAID (Razorpay)</td>
          </tr>
        </table>

        <!-- Order Items -->
        <h3 style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-bottom: 0;">Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #1e293b;">
              <th style="padding: 10px 0; text-align: left; color: #64748b; font-size: 11px; text-transform: uppercase;">Item</th>
              <th style="padding: 10px 0; text-align: center; color: #64748b; font-size: 11px; text-transform: uppercase;">Qty</th>
              <th style="padding: 10px 0; text-align: right; color: #64748b; font-size: 11px; text-transform: uppercase;">Price (Excl. GST)</th>
            </tr>
          </thead>
          <tbody>
            ${details.items.map(item => `
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 12px 0; color: #e2e8f0; font-size: 14px;">
                  <div style="font-weight: bold;">${item.name}</div>
                  <div style="font-size: 11px; color: #64748b; font-family: monospace;">SKU: ${item.sku}</div>
                </td>
                <td style="padding: 12px 0; text-align: center; color: #94a3b8; font-size: 14px;">${item.quantity}</td>
                <td style="padding: 12px 0; text-align: right; color: #60a5fa; font-weight: bold; font-size: 14px;">₹${(item.price / 1.18).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Order Totals -->
        <div style="margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #94a3b8;">
            <tr>
              <td style="padding: 4px 0;">Items Subtotal:</td>
              <td style="padding: 4px 0; text-align: right; color: #f8fafc;">₹${(details.totalItemsPrice - details.taxCost).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">GST (18%):</td>
              <td style="padding: 4px 0; text-align: right; color: #f8fafc;">₹${details.taxCost.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Shipping:</td>
              <td style="padding: 4px 0; text-align: right; color: #f8fafc;">₹${details.shippingCost.toFixed(2)}</td>
            </tr>
            <tr style="font-size: 16px; font-weight: bold; color: #f8fafc;">
              <td style="padding: 16px 0 0 0;">Total Amount Paid:</td>
              <td style="padding: 16px 0 0 0; text-align: right; color: #60a5fa; font-size: 18px; font-weight: 900;">₹${details.totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0;">This is an automated invoice transaction receipt from Electra Private Ltd.</p>
          <p style="margin: 4px 0 0 0;">Okhla Industrial Area, New Delhi, India.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Sends a premium HTML Dispatch email to the customer post-order shipment.
 */
export async function sendShippingUpdate(
  email: string,
  details: {
    orderNumber: string;
    customerName: string;
    carrier: string;
    trackingNumber: string;
    labelUrl: string;
    estimatedDelivery: string;
  }
): Promise<boolean> {
  const subject = `Your Electra Order Has Shipped! - ${details.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="background-color: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; margin: 0;">
      <div style="max-w: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
        
        <!-- Logo/Header -->
        <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 24px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #10b981; letter-spacing: -0.025em;">ELECTRA LOGISTICS</h1>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; uppercase; letter-spacing: 0.1em;">Dispatch Alert</p>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom: 24px; font-size: 14px;">
          <p style="margin: 4px 0;"><strong>Hi ${details.customerName},</strong></p>
          <p style="margin: 4px 0; color: #94a3b8;">Great news! Your electronic goods have been packed, labeled, and dispatched from our New Delhi hub via <strong>${details.carrier}</strong>.</p>
        </div>

        <!-- Tracking Card -->
        <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Carrier:</td>
              <td style="padding: 4px 0; text-align: right; color: #f8fafc; font-weight: bold;">${details.carrier}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Tracking Code:</td>
              <td style="padding: 4px 0; text-align: right; color: #38bdf8; font-family: monospace; font-weight: bold; font-size: 14px;">${details.trackingNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Expected Delivery:</td>
              <td style="padding: 4px 0; text-align: right; color: #34d399; font-weight: bold;">${details.estimatedDelivery}</td>
            </tr>
          </table>
        </div>

        <!-- Call to Action (Removed Dummy PDF) -->

        <!-- Footer -->
        <div style="margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0;">Tracking data may take 12-24 hours to sync with ${details.carrier}'s systems.</p>
          <p style="margin: 4px 0 0 0;">Electra India Logistics.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Sends a critical HTML Alert email to the administrator when inventory levels run low.
 */
export async function sendLowStockAlert(
  sku: string,
  name: string,
  stock: number
): Promise<boolean> {
  const subject = `[URGENT ALERT] Low Stock Warning: ${name} (${sku})`;
  const email = 'warehouse-admin@electra.com';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="background-color: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; margin: 0;">
      <div style="max-w: 600px; margin: 0 auto; background-color: #0f172a; border: 2px solid #ef4444; border-radius: 16px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.15);">
        
        <!-- Danger Alert Banner -->
        <div style="background-color: #ef4444/10; text-align: center; border-bottom: 1px solid #ef4444/20; padding-bottom: 24px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ef4444; tracking-tight: -0.025em;">LOW INVENTORY ALERT</h1>
          <p style="margin: 4px 0 0 0; color: #ef4444; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Warehouse Replenishment Needed</p>
        </div>

        <div style="font-size: 14px; margin-bottom: 24px;">
          <p style="margin: 0;">Attention Logistics Admin,</p>
          <p style="margin: 8px 0 0 0; color: #94a3b8; line-height: 1.5;">This automated alert was triggered because the available stock count for the following electronics product has dropped below the threshold of <strong>3 units</strong>:</p>
        </div>

        <!-- Product Specs Card -->
        <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Product Name:</td>
              <td style="padding: 6px 0; text-align: right; color: #f8fafc; font-weight: bold;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">SKU Code:</td>
              <td style="padding: 6px 0; text-align: right; color: #e2e8f0; font-family: monospace; font-weight: bold;">${sku}</td>
            </tr>
            <tr style="font-size: 15px; font-weight: bold;">
              <td style="padding: 6px 0; color: #ef4444;">Available Count:</td>
              <td style="padding: 6px 0; text-align: right; color: #ef4444; font-weight: 900;">${stock} Left</td>
            </tr>
          </table>
        </div>

        <div style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px;">
          <p style="margin: 0;"><strong>Action Required:</strong> Please contact the electronics supplier immediately to issue a Restock Purchase Order (PO) to prevent catalog purchase disruptions.</p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0;">Electra Warehouse Inventory Management System.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}
