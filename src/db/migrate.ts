/**
 * DB Migration Script
 * SQLite 데이터베이스를 초기화하고 마이그레이션 실행
 */

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './index';
import path from 'path';

async function runMigrations() {
  console.log('[Migration] Starting...');

  try {
    // 마이그레이션 실행
    migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
    console.log('[Migration] ✅ Completed successfully!');
  } catch (error) {
    console.error('[Migration] ❌ Failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

runMigrations();
