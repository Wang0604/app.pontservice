import type { Config } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  // drizzle-kit runs locally; fall back to a placeholder to avoid throwing during typecheck
  process.env.DATABASE_URL = 'postgres://placeholder:placeholder@localhost:5432/placeholder';
}

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
