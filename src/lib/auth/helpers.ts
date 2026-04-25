import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './server';
import { isAdminEmail } from '@/lib/env';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentSession() {
  return await auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect('/login');
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  const email = session.user.email;
  const userRecord = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });

  const isAdmin = userRecord?.role === 'admin' || isAdminEmail(email);
  if (!isAdmin) {
    redirect('/');
  }
  return session;
}

export async function ensureUserRoleFromEnv(userId: string, email: string) {
  if (isAdminEmail(email)) {
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, userId));
  }
}

/**
 * Read the most up-to-date phone number / company name from the DB. The session
 * object can become stale because Better Auth caches additional fields at sign-in.
 */
export async function getEnrichedUser(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  return row ?? null;
}
