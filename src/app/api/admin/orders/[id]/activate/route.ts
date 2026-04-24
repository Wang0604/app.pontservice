import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/helpers';
import { activateOrder } from '@/lib/orders/activate';

const schema = z.object({
  invoiceNumber: z.string().min(3).max(100),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: '参数不对', details: body.error.flatten() }, { status: 400 });
  }

  try {
    const result = await activateOrder({
      orderId: params.id,
      adminUserId: session.user.id,
      invoiceNumber: body.data.invoiceNumber,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[activate] failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '激活失败' },
      { status: 500 },
    );
  }
}
