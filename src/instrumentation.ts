/**
 * Next.js instrumentation hook — runs once per server startup.
 *
 * Currently used to bootstrap the PGlite schema in dev mode so the auth /
 * register / login / forgot-password flows "just work" without an external
 * Postgres. Skipped in production / postgres-js mode.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { ensurePgliteSchema } = await import('@/lib/db/bootstrap-pglite');
  try {
    await ensurePgliteSchema();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[instrumentation] PGlite schema bootstrap failed', err);
  }
}
