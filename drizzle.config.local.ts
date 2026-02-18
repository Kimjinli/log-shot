import type { Config } from 'drizzle-kit';

/**
 * Drizzle 설정 - 로컬 개발 환경 (SQLite)
 */
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './data/sqlite.db',
  },
} satisfies Config;
