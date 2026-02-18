import type { Config } from 'drizzle-kit';

/**
 * Drizzle 설정 - Vercel 배포 환경 (PostgreSQL)
 */
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
