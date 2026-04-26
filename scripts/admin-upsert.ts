/**
 * scripts/admin-upsert.ts
 *
 * 直接在 Railway Postgres 里创建 / 更新一个 admin 账号，绕开前端注册流程
 * （现在 SMS 还是 stub，前端 /register 在生产上跑不通，所以只能走脚本）。
 *
 * 行为
 * ----
 * 给一个邮箱 + 密码：
 *   - 数据库里**没有**这个 user → INSERT user (role=admin, emailVerified=true)
 *                              + INSERT credential account
 *                              + 50 welcome credits
 *   - 数据库里**已经有**这个 user →
 *       · 更新密码（一定）
 *       · 如果 role 不是 admin，提权到 admin
 *       · 如果没 credential account，补一个
 *
 * 全程一个 transaction，要么全成要么全回滚。可重复跑（幂等）。
 *
 * 用法
 * ----
 *
 * 1) 只查（read-only，不改库）：
 *
 *    DATABASE_URL='postgres://...' \
 *      ADMIN_EMAIL='boss@company.com' \
 *      pnpm admin:upsert
 *
 * 2) 创建新 admin（user 还不存在）：
 *
 *    DATABASE_URL='postgres://...' \
 *      ADMIN_EMAIL='boss@company.com' \
 *      ADMIN_PASSWORD='SuperSecure123!' \
 *      ADMIN_NAME='张老板' \
 *      pnpm admin:upsert
 *
 * 3) 重置已有 admin 的密码（user 已存在）：
 *
 *    DATABASE_URL='postgres://...' \
 *      ADMIN_EMAIL='1242928350@qq.com' \
 *      ADMIN_PASSWORD='NewPassword123' \
 *      pnpm admin:upsert
 *
 * 4) 把已有的普通 user 提权成 admin（顺便也会重置密码）：
 *
 *    （同上 #3，脚本检测到 role!=admin 时会自动提权）
 *
 * 安全
 * ----
 * - 永远不要把 ADMIN_PASSWORD 写进文件 / commit。
 * - zsh 用户：命令前加一个空格 ` ADMIN_PASSWORD=...`，
 *   配合 `setopt HIST_IGNORE_SPACE` 可以让这条不进 history。
 * - 哈希算法和 Better Auth 一致（scrypt N=16384, r=16, p=1, dkLen=64），
 *   不依赖 BETTER_AUTH_SECRET。
 */

import { hashPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../src/lib/db';
import { accounts, creditBalances, creditTransactions, users } from '../src/lib/db/schema';

const TARGET_EMAIL = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const NEW_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const TARGET_NAME = (process.env.ADMIN_NAME ?? '').trim();
const TARGET_COMPANY = (process.env.ADMIN_COMPANY ?? '').trim();
const MIN_PASSWORD_LEN = 8;
const WELCOME_CREDITS = 50;

function bail(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function printUsage() {
  console.error(
    [
      'ADMIN_EMAIL is required.',
      '',
      '  Read-only check:',
      "    DATABASE_URL='...' ADMIN_EMAIL='you@example.com' \\",
      '      pnpm admin:upsert',
      '',
      '  Create or reset:',
      "    DATABASE_URL='...' ADMIN_EMAIL='you@example.com' \\",
      "      ADMIN_PASSWORD='YourPass1234' \\",
      "      ADMIN_NAME='张老板' \\",
      '      pnpm admin:upsert',
    ].join('\n'),
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    bail('DATABASE_URL is not set. Set it to the Railway Postgres connection string.');
  }
  if (!TARGET_EMAIL) {
    printUsage();
    process.exit(1);
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, TARGET_EMAIL))
    .limit(1);

  let existingCred:
    | { id: string; userId: string; password: string | null }
    | undefined;
  if (existingUser) {
    [existingCred] = await db
      .select({
        id: accounts.id,
        userId: accounts.userId,
        password: accounts.password,
      })
      .from(accounts)
      .where(
        and(eq(accounts.userId, existingUser.id), eq(accounts.providerId, 'credential')),
      )
      .limit(1);
  }

  // ---- Read-only mode ----
  if (!NEW_PASSWORD) {
    console.log('\n--- Read-only check ---');
    if (!existingUser) {
      console.log(`No user with email "${TARGET_EMAIL}".`);
      console.log(
        'Pass ADMIN_PASSWORD to create one as admin (with credential + 50 welcome credits).',
      );
    } else {
      console.log('Found user:');
      console.log(`  id        : ${existingUser.id}`);
      console.log(`  email     : ${existingUser.email}`);
      console.log(`  role      : ${existingUser.role}`);
      console.log(`  fullName  : ${existingUser.fullName ?? '(unset)'}`);
      console.log(`  companyName: ${existingUser.companyName ?? '(unset)'}`);
      console.log(`  phone     : ${existingUser.phoneNumber ?? '(unset)'}`);
      console.log(`  createdAt : ${existingUser.createdAt.toISOString()}`);
      console.log(
        existingCred
          ? `  credential: yes (account ${existingCred.id}, password is set)`
          : `  credential: NO — user can't log in with email+password yet`,
      );
      console.log(
        '\nPass ADMIN_PASSWORD to update password ' +
          (existingUser.role !== 'admin' ? 'and promote to admin.' : '(role is already admin).'),
      );
    }
    console.log('\n— Database not modified. —\n');
    process.exit(0);
  }

  // ---- Mutation mode ----
  if (NEW_PASSWORD.length < MIN_PASSWORD_LEN) {
    bail(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LEN} characters.`);
  }

  console.log(`\n→ Hashing password (scrypt) ...`);
  const hashed = await hashPassword(NEW_PASSWORD);

  await db.transaction(async (tx) => {
    if (!existingUser) {
      // ---------- BRAND NEW ADMIN ----------
      const userId = randomUUID();
      const now = new Date();

      await tx.insert(users).values({
        id: userId,
        email: TARGET_EMAIL,
        emailVerified: true,
        name: TARGET_NAME || null,
        fullName: TARGET_NAME || null,
        companyName: TARGET_COMPANY || null,
        role: 'admin',
        phoneNumberVerified: false,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(accounts).values({
        id: randomUUID(),
        userId,
        // For credential provider, accountId mirrors userId
        accountId: userId,
        providerId: 'credential',
        password: hashed,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(creditBalances).values({
        userId,
        availableCredits: WELCOME_CREDITS,
        totalGranted: WELCOME_CREDITS,
        totalConsumed: 0,
        updatedAt: now,
      });

      await tx.insert(creditTransactions).values({
        userId,
        amount: WELCOME_CREDITS,
        type: 'grant',
        reason: '注册赠送 (admin upsert)',
        balanceAfter: WELCOME_CREDITS,
      });

      console.log('\n✓ Created new admin:');
      console.log(`  id        : ${userId}`);
      console.log(`  email     : ${TARGET_EMAIL}`);
      console.log(`  role      : admin`);
      console.log(`  credentials: set`);
      console.log(`  credits   : ${WELCOME_CREDITS}`);
      return;
    }

    // ---------- EXISTING USER: UPDATE ----------
    const ops: string[] = [];

    if (existingCred) {
      await tx
        .update(accounts)
        .set({ password: hashed, updatedAt: new Date() })
        .where(eq(accounts.id, existingCred.id));
      ops.push(`updated password on credential account ${existingCred.id}`);
    } else {
      const newCredId = randomUUID();
      await tx.insert(accounts).values({
        id: newCredId,
        userId: existingUser.id,
        accountId: existingUser.id,
        providerId: 'credential',
        password: hashed,
      });
      ops.push(`created credential account ${newCredId}`);
    }

    if (existingUser.role !== 'admin') {
      await tx
        .update(users)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(users.id, existingUser.id));
      ops.push(`promoted role from "${existingUser.role}" to "admin"`);
    }

    console.log(`\n✓ Updated user ${existingUser.email}:`);
    for (const op of ops) console.log(`  - ${op}`);
  });

  console.log(
    `\nDone. ${TARGET_EMAIL} can now sign in at /login with the new password.\n` +
      `Tip: have them change the password from their account page after first login.\n`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('\n[admin-upsert] failed:', err);
  process.exit(1);
});
