import { eq, sql, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { creditBalances, creditTransactions, type CreditTxnType } from '@/lib/db/schema';

export const WELCOME_CREDITS = 50;

export async function getBalance(userId: string) {
  const [row] = await db.select().from(creditBalances).where(eq(creditBalances.userId, userId));
  return row ?? null;
}

export async function listTransactions(userId: string, limit = 50) {
  return await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}

/**
 * Grant credits (positive amount). Safe to call for new or existing users.
 */
export async function grantCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  orderId?: string;
  type?: CreditTxnType;
}): Promise<{ balanceAfter: number }> {
  if (params.amount <= 0) throw new Error('grantCredits amount must be positive');

  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, params.userId))
      .for('update');

    let newBalance: number;
    if (existing.length === 0) {
      newBalance = params.amount;
      await tx.insert(creditBalances).values({
        userId: params.userId,
        availableCredits: params.amount,
        totalGranted: params.amount,
        totalConsumed: 0,
      });
    } else {
      newBalance = existing[0].availableCredits + params.amount;
      await tx
        .update(creditBalances)
        .set({
          availableCredits: newBalance,
          totalGranted: sql`${creditBalances.totalGranted} + ${params.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(creditBalances.userId, params.userId));
    }

    await tx.insert(creditTransactions).values({
      userId: params.userId,
      amount: params.amount,
      type: params.type ?? 'grant',
      reason: params.reason,
      orderId: params.orderId,
      balanceAfter: newBalance,
    });

    return { balanceAfter: newBalance };
  });
}

/**
 * Consume credits. Throws if insufficient balance.
 */
export async function consumeCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  toolRunId?: string;
}): Promise<{ balanceAfter: number }> {
  if (params.amount <= 0) throw new Error('consumeCredits amount must be positive');

  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, params.userId))
      .for('update');

    if (existing.length === 0 || existing[0].availableCredits < params.amount) {
      throw new Error('Insufficient credits');
    }

    const newBalance = existing[0].availableCredits - params.amount;
    await tx
      .update(creditBalances)
      .set({
        availableCredits: newBalance,
        totalConsumed: sql`${creditBalances.totalConsumed} + ${params.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(creditBalances.userId, params.userId));

    await tx.insert(creditTransactions).values({
      userId: params.userId,
      amount: -params.amount,
      type: 'consume',
      reason: params.reason,
      toolRunId: params.toolRunId,
      balanceAfter: newBalance,
    });

    return { balanceAfter: newBalance };
  });
}

/**
 * Refund credits previously consumed (used when tool run fails).
 */
export async function refundCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  toolRunId?: string;
}): Promise<{ balanceAfter: number }> {
  return grantCredits({
    userId: params.userId,
    amount: params.amount,
    reason: params.reason,
    type: 'refund',
  }).then((r) => {
    return r;
  });
}

/**
 * Ensure a user has a credit_balances row (called right after signup).
 * Only grants welcome credits ONE time.
 */
export async function ensureWelcomeCreditsOnce(userId: string): Promise<void> {
  const existing = await getBalance(userId);
  if (existing) return;

  await grantCredits({
    userId,
    amount: WELCOME_CREDITS,
    reason: '注册赠送',
  });
}
