import 'dotenv/config';
import { db, users, creditBalances, creditTransactions, leads } from './index';
import { randomUUID } from 'crypto';

async function main() {
  console.log('[seed] starting');

  const testAdminId = 'seed-admin-' + randomUUID();
  const testUserId = 'seed-user-' + randomUUID();

  await db
    .insert(users)
    .values([
      {
        id: testAdminId,
        email: '[email protected]',
        emailVerified: true,
        name: 'Test Admin',
        role: 'admin',
      },
      {
        id: testUserId,
        email: '[email protected]',
        emailVerified: true,
        name: 'Test User',
        role: 'user',
        companyName: '测试科技有限公司',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(creditBalances)
    .values([
      { userId: testAdminId, availableCredits: 999, totalGranted: 999 },
      { userId: testUserId, availableCredits: 50, totalGranted: 50 },
    ])
    .onConflictDoNothing();

  await db.insert(creditTransactions).values({
    userId: testUserId,
    amount: 50,
    type: 'grant',
    reason: '注册赠送',
    balanceAfter: 50,
  });

  await db.insert(leads).values({
    companyName: '样本制造有限公司',
    contactName: '张老板',
    email: '[email protected]',
    phone: '13800138000',
    interestedPlan: '2999',
    useCase: '每月 200+ 张发票要整理，现在人工录入 3 天。希望 OCR 能把时间压到 2 小时。',
    source: 'referral',
    status: 'new',
  });

  console.log('[seed] done');
  console.log(`  admin: [email protected]`);
  console.log(`  user:  [email protected]`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
