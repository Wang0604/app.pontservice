import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, leads, users, paymentReceipts } from '@/lib/db/schema';
import { grantCredits } from '@/lib/credits';
import { getPlan } from '@/lib/pricing';
import { generateInvoicePdf, buildInvoiceData } from '@/lib/invoices/generate';
import { storageProvider } from '@/lib/providers/storage/r2';
import { emailProvider } from '@/lib/providers/email/resend';
import { activationEmail } from '@/lib/providers/email/templates';

export async function activateOrder(params: {
  orderId: string;
  adminUserId: string;
  invoiceNumber: string;
}): Promise<{ ok: true; userId: string; creditsGranted: number; invoiceKey: string }> {
  const [order] = await db.select().from(orders).where(eq(orders.id, params.orderId));
  if (!order) throw new Error('order not found');
  if (order.paperworkStatus === 'activated') throw new Error('already activated');

  const plan = getPlan(order.planType);
  if (!plan) throw new Error(`unknown plan ${order.planType}`);

  const [lead] = order.leadId
    ? await db.select().from(leads).where(eq(leads.id, order.leadId))
    : [undefined];
  if (!lead) throw new Error('lead missing');

  let userId = order.userId ?? null;
  if (!userId) {
    const [existingUser] = await db.select().from(users).where(eq(users.email, lead.email));
    if (existingUser) {
      userId = existingUser.id;
    } else {
      userId = `user-${randomUUID()}`;
      await db.insert(users).values({
        id: userId,
        email: lead.email,
        emailVerified: true,
        name: lead.contactName,
        companyName: lead.companyName,
        phone: lead.phone,
        role: 'user',
      });
    }
  }

  await grantCredits({
    userId,
    amount: plan.credits,
    reason: `订单 ${order.orderNumber} 激活发放`,
    orderId: order.id,
  });

  const invoicePdf = await generateInvoicePdf(
    buildInvoiceData({
      invoiceNumber: params.invoiceNumber,
      buyerName: lead.companyName,
      totalAmount: parseFloat(order.actualAmountCny),
      itemName: plan.label,
    }),
  );
  const invoiceKey = `invoices/${order.id}/${params.invoiceNumber}.pdf`;
  await storageProvider.putObject({
    key: invoiceKey,
    body: invoicePdf,
    contentType: 'application/pdf',
  });

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        userId,
        paperworkStatus: 'activated',
        activatedAt: new Date(),
        paidAt: order.paidAt ?? new Date(),
        creditsGranted: plan.credits,
        invoiceNumber: params.invoiceNumber,
        invoiceR2Key: invoiceKey,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await tx
      .update(leads)
      .set({ status: 'activated', userId, updatedAt: new Date() })
      .where(eq(leads.id, lead.id));

    await tx
      .update(paymentReceipts)
      .set({ status: 'verified', verifiedBy: params.adminUserId, verifiedAt: new Date() })
      .where(eq(paymentReceipts.orderId, order.id));
  });

  const invoiceBuffer = Buffer.isBuffer(invoicePdf) ? invoicePdf : Buffer.from(invoicePdf);
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const { subject, html } = activationEmail({
      companyName: lead.companyName,
      orderNumber: order.orderNumber,
      creditsGranted: plan.credits,
      loginUrl: `${appUrl}/account`,
    });
    await emailProvider.send({
      to: lead.email,
      subject,
      html,
      attachments: [
        {
          filename: `Invoice-${params.invoiceNumber}.pdf`,
          content: invoiceBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    console.error('[activate] activation email failed', err);
  }

  return { ok: true, userId, creditsGranted: plan.credits, invoiceKey };
}
