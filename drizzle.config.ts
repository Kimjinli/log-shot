import type { Config } from 'drizzle-kit';

/**
 * Drizzle 설정 - 환경 감지 자동 설정
 * DATABASE_URL이 있으면 PostgreSQL, 없으면 SQLite 사용
 */
const isPostgres = !!process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: isPostgres ? 'postgresql' : 'sqlite',
  dbCredentials: isPostgres
    ? { url: process.env.DATABASE_URL! }
    : { url: process.env.DATABASE_PATH || './data/sqlite.db' },
} satisfies Config;
