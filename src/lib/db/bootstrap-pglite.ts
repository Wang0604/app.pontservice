/**
 * Server-only PGlite schema bootstrap. Imported by `src/instrumentation.ts`
 * via dynamic import so webpack doesn't try to bundle `fs` / `path` for
 * non-node runtimes.
 *
 * Strictly dev-only — in production we use real Postgres and `drizzle-kit push`.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve as pathResolve, join as pathJoin } from 'path';
import {
  isUsingPglite,
  isSchemaApplied,
  markSchemaApplied,
  getPgliteClient,
} from './index';

export async function ensurePgliteSchema(): Promise<void> {
  if (!isUsingPglite()) return;
  if (isSchemaApplied()) return;

  const client = getPgliteClient();
  if (!client) return;

  const migrationPath = pathResolve(process.cwd(), 'drizzle');
  if (!existsSync(migrationPath)) {
    // eslint-disable-next-line no-console
    console.warn('[db] drizzle/ folder not found; skipping schema bootstrap');
    markSchemaApplied();
    return;
  }

  const files = readdirSync(migrationPath)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let appliedCount = 0;
  for (const file of files) {
    const sql = readFileSync(pathJoin(migrationPath, file), 'utf8');
    // Drizzle-generated SQL uses `--> statement-breakpoint` between statements
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      try {
        await client.exec(stmt);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Tolerate "already exists" errors so reruns are idempotent
        if (!/already exists|duplicate/i.test(msg)) {
          // eslint-disable-next-line no-console
          console.error(`[db] migration statement failed: ${msg}\nSQL:\n${stmt.slice(0, 200)}`);
        }
      }
    }
    appliedCount += 1;
  }
  markSchemaApplied();
  // eslint-disable-next-line no-console
  console.log(`[db] applied ${appliedCount} migration file(s) to PGlite`);
}
