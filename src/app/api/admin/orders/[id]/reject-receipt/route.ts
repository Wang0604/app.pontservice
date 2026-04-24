import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, paymentReceipts } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/helpers';

const schema = z.object({
  reason: z.string().min(1).max(500),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: 'bad payload' }, { status: 400 });

  await db.transaction(async (tx) => {
    await tx
      .update(paymentReceipts)
      .set({
        status: 'rejected',
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
        verificationNote: body.data.reason,
      })
      .where(eq(paymentReceipts.orderId, params.id));

    await tx
      .update(orders)
      .set({ paperworkStatus: 'contract_signed', updatedAt: new Date() })
      .where(eq(orders.id, params.id));
  });

  return NextResponse.json({ ok: true });
}
