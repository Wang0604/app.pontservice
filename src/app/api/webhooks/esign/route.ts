import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contracts, leads, orders } from '@/lib/db/schema';
import { esignProvider } from '@/lib/providers/esign';
import { emailProvider } from '@/lib/providers/email/resend';
import { paymentInstructionEmail } from '@/lib/providers/email/templates';

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const signature = req.headers.get('x-esign-signature') ?? '';

  const verify = await esignProvider.verifyWebhook(bodyText, signature);
  if (!verify.valid) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const { event, taskId } = verify;
  if (!taskId) {
    return NextResponse.json({ error: 'missing taskId' }, { status: 400 });
  }

  const [contract] = await db.select().from(contracts).where(eq(contracts.esignTaskId, taskId));
  if (!contract) return NextResponse.json({ error: 'contract not found' }, { status: 404 });

  if (event === 'signed' && contract.status !== 'signed') {
    const result = await db.transaction(async (tx) => {
      const [updatedContract] = await tx
        .update(contracts)
        .set({ status: 'signed', signedAt: new Date(), updatedAt: new Date() })
        .where(eq(contracts.id, contract.id))
        .returning();

      const [updatedOrder] = await tx
        .update(orders)
        .set({ paperworkStatus: 'contract_signed', updatedAt: new Date() })
        .where(eq(orders.id, contract.orderId))
        .returning();

      if (updatedOrder.leadId) {
        await tx
          .update(leads)
          .set({ status: 'contract_signed', updatedAt: new Date() })
          .where(eq(leads.id, updatedOrder.leadId));
      }

      const [lead] = updatedOrder.leadId
        ? await tx.select().from(leads).where(eq(leads.id, updatedOrder.leadId))
        : [undefined];

      return { contract: updatedContract, order: updatedOrder, lead };
    });

    if (result.lead) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      const { subject, html } = paymentInstructionEmail({
        companyName: result.lead.companyName,
        orderNumber: result.order.orderNumber,
        amountCny: parseFloat(result.order.actualAmountCny).toLocaleString(),
        orderUrl: `${appUrl}/orders/${result.order.id}`,
      });
      await emailProvider.send({ to: result.lead.email, subject, html }).catch(console.error);
    }
  } else if (event === 'viewed' && contract.status === 'sent') {
    await db
      .update(contracts)
      .set({ status: 'viewing', updatedAt: new Date() })
      .where(eq(contracts.id, contract.id));
  } else if ((event === 'declined' || event === 'expired') && contract.status !== 'signed') {
    await db
      .update(contracts)
      .set({ status: 'voided', updatedAt: new Date() })
      .where(eq(contracts.id, contract.id));
    await db
      .update(orders)
      .set({ paperworkStatus: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.id, contract.orderId));
  }

  return NextResponse.json({ ok: true });
}
