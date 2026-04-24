import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads, LEAD_STATUSES } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/helpers';

const schema = z.object({
  status: z.enum(LEAD_STATUSES),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: '参数不对' }, { status: 400 });
  }

  const [updated] = await db
    .update(leads)
    .set({ status: body.data.status, notes: body.data.notes, updatedAt: new Date() })
    .where(eq(leads.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'lead not found' }, { status: 404 });

  return NextResponse.json({ ok: true, lead: updated });
}
