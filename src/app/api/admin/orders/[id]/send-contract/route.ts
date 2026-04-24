import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contracts, leads, orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/helpers';
import { emailProvider } from '@/lib/providers/email/resend';
import { contractReadyEmail } from '@/lib/providers/email/templates';
import { getPlanShortLabel } from '@/lib/pricing';
import { esignProvider } from '@/lib/providers/esign';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();

  const orderId = params.id;

  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId));
  if (orderRows.length === 0) return NextResponse.json({ error: 'order not found' }, { status: 404 });
  const order = orderRows[0];

  if (!order.contractId) return NextResponse.json({ error: '合同未生成' }, { status: 400 });
  if (!order.leadId) return NextResponse.json({ error: 'lead missing' }, { status: 400 });

  const [contract] = await db.select().from(contracts).where(eq(contracts.id, order.contractId));
  if (!contract) return NextResponse.json({ error: 'contract missing' }, { status: 404 });
  if (!contract.pdfR2Key) {
    return NextResponse.json({ error: '合同 PDF 尚未生成，请稍后再试' }, { status: 409 });
  }

  const [lead] = await db.select().from(leads).where(eq(leads.id, order.leadId));
  if (!lead) return NextResponse.json({ error: 'lead missing' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const contractUrl = `${appUrl}/contracts/${contract.id}`;

  const signTask = await esignProvider.createSignTask({
    orderId: order.id,
    contractId: contract.id,
    pdfUrl: contractUrl + '/pdf',
    signers: [
      { role: 'customer', name: lead.contactName, email: lead.email, phone: lead.phone ?? undefined },
      {
        role: 'provider',
        name: process.env.COMPANY_LEGAL_REPRESENTATIVE ?? '乙方',
        email: process.env.RESEND_ADMIN_EMAIL?.split(',')[0] ?? '',
      },
    ],
    returnUrl: contractUrl,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(contracts)
      .set({
        status: 'sent',
        esignProvider: signTask.provider,
        esignTaskId: signTask.taskId,
        esignSignUrl: signTask.signUrl,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contract.id));

    await tx
      .update(orders)
      .set({ paperworkStatus: 'contract_sent', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await tx.update(leads).set({ status: 'contract_sent', updatedAt: new Date() }).where(eq(leads.id, lead.id));
  });

  const { subject, html } = contractReadyEmail({
    companyName: lead.companyName,
    contractUrl,
    planLabel: getPlanShortLabel(order.planType),
  });

  await emailProvider.send({ to: lead.email, subject, html });

  return NextResponse.json({ ok: true, contractUrl, esignTaskId: signTask.taskId });
}
