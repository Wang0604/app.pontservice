import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type Db = ReturnType<typeof createDbReal>;

const globalForDb = globalThis as unknown as {
  db: Db | undefined;
  client: ReturnType<typeof postgres> | undefined;
};

function createDbReal() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client =
    globalForDb.client ??
    postgres(connectionString, {
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.client = client;
  }

  return drizzle(client, { schema, logger: process.env.NODE_ENV === 'development' });
}

/**
 * Lazy Proxy: defer real DB client creation until first real query.
 * This lets Next.js build (which imports modules without runtime env)
 * succeed even if DATABASE_URL isn't set at build time.
 */
function lazyDb(): Db {
  if (globalForDb.db) return globalForDb.db;

  const proxy = new Proxy({} as Db, {
    get(_, prop) {
      if (!globalForDb.db) globalForDb.db = createDbReal();
      const value = (globalForDb.db as unknown as Record<string | symbol, unknown>)[
        prop as string | symbol
      ];
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(globalForDb.db);
      }
      return value;
    },
  });

  return proxy;
}

export const db = lazyDb();

export { schema };
export * from './schema';
