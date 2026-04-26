import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { PLAN_IDS } from '@/lib/pricing';
import { emailProvider } from '@/lib/providers/email/resend';
import { leadNotificationEmail } from '@/lib/providers/email/templates';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

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

function getBearerToken(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function isValidLeadApiToken(req: NextRequest) {
  const expectedToken = process.env.LEADS_API_TOKEN;
  const token = getBearerToken(req);

  if (!expectedToken || !token) {
    return false;
  }

  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedToken);

  if (tokenBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(tokenBuffer, expectedBuffer);
}

export async function POST(req: NextRequest) {
  if (!isValidLeadApiToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  let leadRow: { id: string };
  try {
    const supabase = getSupabaseServiceClient();
    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        company_name: data.companyName,
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone || null,
        interested_plan: data.interestedPlan,
        use_case: data.useCase || null,
        notes: data.notes || null,
        source: data.source ?? 'website',
        status: 'new',
      })
      .select('id')
      .single();

    if (insertError || !insertedLead) {
      console.error('[leads] supabase insert failed', insertError);
      return NextResponse.json({ error: '保存失败' }, { status: 500 });
    }

    leadRow = insertedLead;
  } catch (err) {
    console.error('[leads] supabase insert failed', err);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }

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
