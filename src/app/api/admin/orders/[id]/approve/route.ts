import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contracts, leads, orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/helpers';
import { getPlan } from '@/lib/pricing';
import { inngest } from '@/lib/inngest/client';

const schema = z.object({
  amountCny: z.number().positive(),
  earlyBird: z.boolean(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: '参数不对' }, { status: 400 });
  }

  const orderId = params.id;

  const result = await db.transaction(async (tx) => {
    const orderRows = await tx.select().from(orders).where(eq(orders.id, orderId));
    if (orderRows.length === 0) throw new Error('order not found');
    const order = orderRows[0];

    const plan = getPlan(order.planType);
    if (!plan) throw new Error('unknown plan');

    const [updatedOrder] = await tx
      .update(orders)
      .set({
        actualAmountCny: body.data.amountCny.toFixed(2),
        earlyBird: body.data.earlyBird,
        paperworkStatus: 'pending_approval',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (order.leadId) {
      await tx.update(leads).set({ status: 'approved', updatedAt: new Date() }).where(eq(leads.id, order.leadId));
    }

    let contractId = order.contractId;
    if (!contractId) {
      const [contract] = await tx
        .insert(contracts)
        .values({
          orderId: order.id,
          templateId: plan.contractTemplateId,
          variables: {},
          status: 'draft',
          approvedBy: session.user.id,
          approvedAt: new Date(),
        })
        .returning();
      contractId = contract.id;

      await tx.update(orders).set({ contractId: contract.id }).where(eq(orders.id, orderId));
    } else {
      await tx
        .update(contracts)
        .set({ approvedBy: session.user.id, approvedAt: new Date(), status: 'draft', updatedAt: new Date() })
        .where(eq(contracts.id, contractId));
    }

    return { orderId: updatedOrder.id, contractId };
  });

  await inngest.send({
    name: 'contract/generate.requested',
    data: { contractId: result.contractId },
  });

  return NextResponse.json({ ok: true, ...result });
}
