import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { toolRuns } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/helpers';

export async function GET(req: NextRequest) {
  const session = await requireUser();

  const runId = req.nextUrl.searchParams.get('runId');
  if (!runId) return NextResponse.json({ error: 'runId required' }, { status: 400 });

  const [run] = await db.select().from(toolRuns).where(eq(toolRuns.id, runId));
  if (!run) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (run.userId !== session.user.id)
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  return NextResponse.json({
    runId: run.id,
    status: run.status,
    output: run.output,
    error: run.error,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
  });
}
