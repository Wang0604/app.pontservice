import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contracts, leads, orders } from '@/lib/db/schema';
import { emailProvider } from '@/lib/providers/email/resend';
import { paymentInstructionEmail } from '@/lib/providers/email/templates';

/**
 * Stub signing endpoint.
 *
 * Only used when ESIGN_PROVIDER=stub. Marks the contract as signed 
 * directly based on customer confirmation action on the contract page.
 *
 * When a real provider is wired, contract state transitions come from
 * /api/webhooks/esign instead, and this endpoint can reject all calls.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (process.env.ESIGN_PROVIDER && process.env.ESIGN_PROVIDER !== 'stub') {
    return NextResponse.json(
      { error: '此端点仅在 stub 模式下可用，真实签署请使用供应商签署链接' },
      { status: 403 },
    );
  }

  const [contract] = await db.select().from(contracts).where(eq(contracts.id, params.id));
  if (!contract) return NextResponse.json({ error: 'contract not found' }, { status: 404 });

  if (contract.status === 'signed') {
    return NextResponse.json({ ok: true, already: true });
  }

  if (contract.status === 'voided') {
    return NextResponse.json({ error: '合同已作废' }, { status: 400 });
  }

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
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      const { subject, html } = paymentInstructionEmail({
        companyName: result.lead.companyName,
        orderNumber: result.order.orderNumber,
        amountCny: parseFloat(result.order.actualAmountCny).toLocaleString(),
        orderUrl: `${appUrl}/orders/${result.order.id}`,
      });
      await emailProvider.send({ to: result.lead.email, subject, html });
    } catch (err) {
      console.error('[sign] payment instruction email failed', err);
    }
  }

  return NextResponse.json({ ok: true, orderId: result.order.id });
}
