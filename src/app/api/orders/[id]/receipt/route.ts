import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, paymentReceipts, files, leads } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/helpers';

const schema = z.object({
  bankReference: z.string().max(200).optional(),
  amountCny: z.number().positive(),
  receiptKey: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser();
  const orderId = params.id;

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: '参数不对', details: body.error.flatten() }, { status: 400 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 });

  const [lead] = order.leadId ? await db.select().from(leads).where(eq(leads.id, order.leadId)) : [undefined];

  const canAccess =
    order.userId === session.user.id ||
    (lead?.email && lead.email.toLowerCase() === session.user.email.toLowerCase());
  if (!canAccess) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let fileId: string | undefined;
  if (body.data.receiptKey) {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.storageKey, body.data.receiptKey))
      .limit(1);
    if (file) {
      fileId = file.id;
      await db.update(files).set({ uploadStatus: 'uploaded' }).where(eq(files.id, file.id));
    }
  }

  const result = await db.transaction(async (tx) => {
    const [receipt] = await tx
      .insert(paymentReceipts)
      .values({
        orderId,
        fileId,
        bankReference: body.data.bankReference,
        amountCny: body.data.amountCny.toFixed(2),
        paidAt: body.data.paidAt ? new Date(body.data.paidAt) : new Date(),
        uploadedBy: session.user.id,
        status: 'pending',
      })
      .returning();

    await tx
      .update(orders)
      .set({ paperworkStatus: 'payment_submitted', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return receipt;
  });

  return NextResponse.json({ ok: true, receipt: result });
}
