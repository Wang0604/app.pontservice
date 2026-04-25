import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { leads, orders } from '@/lib/db/schema';
import { getCurrentSession } from '@/lib/auth/helpers';
import { getPlan, PLAN_IDS } from '@/lib/pricing';
import { emailProvider } from '@/lib/providers/email/resend';
import { leadNotificationEmail } from '@/lib/providers/email/templates';
import { generateOrderNumber } from '@/lib/utils';

const schema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  interestedPlan: z.enum(PLAN_IDS),
  useCase: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '字段校验失败', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const plan = getPlan(data.interestedPlan);
  if (!plan) {
    return NextResponse.json({ error: '套餐不存在' }, { status: 400 });
  }

  const session = await getCurrentSession();

  const leadRow = await db.transaction(async (tx) => {
    const [lead] = await tx
      .insert(leads)
      .values({
        userId: session?.user.id,
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        interestedPlan: data.interestedPlan,
        useCase: data.useCase,
        notes: data.notes,
        source: data.source ?? 'website',
        status: 'new',
      })
      .returning();

    await tx.insert(orders).values({
      orderNumber: generateOrderNumber(),
      leadId: lead.id,
      userId: session?.user.id,
      planType: data.interestedPlan,
      amountCny: plan.priceCny.toFixed(2),
      actualAmountCny: plan.priceCny.toFixed(2),
      earlyBird: false,
      paperworkStatus: 'draft',
    });

    return lead;
  });

  try {
    const adminEmails = (process.env.RESEND_ADMIN_EMAIL ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (adminEmails.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      const { subject, html } = leadNotificationEmail({
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        interestedPlan: data.interestedPlan,
        useCase: data.useCase,
        leadUrl: `${appUrl}/admin/leads/${leadRow.id}`,
      });
      await emailProvider.send({ to: adminEmails, subject, html });
    }
  } catch (err) {
    console.error('[leads] admin notification email failed', err);
  }

  return NextResponse.json({
    ok: true,
    leadId: leadRow.id,
    message: '已收到申请，我们会尽快联系您',
  });
}
