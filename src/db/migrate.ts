/**
 * Drizzle ORM Migration Script
 * 환경에 따라 자동으로 SQLite 또는 PostgreSQL 마이그레이션 실행
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as migratePg } from 'drizzle-orm/postgres-js/migrator';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import path from 'path';
import fs from 'fs';

async function runMigration() {
  const hasPostgresUrl = process.env.DATABASE_URL?.startsWith('postgres');

  if (hasPostgresUrl) {
    // PostgreSQL 마이그레이션
    console.log('[Migration] Running PostgreSQL migration...');

    const connectionString = process.env.DATABASE_URL!;
    const sql = postgres(connectionString, { max: 1 });
    const db = drizzlePg(sql);

    await migratePg(db, { migrationsFolder: './drizzle' });

    await sql.end();
    console.log('[Migration] PostgreSQL migration completed!');
  } else {
    // SQLite 마이그레이션
    console.log('[Migration] Running SQLite migration...');

    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'sqlite.db');

    // 디렉토리 생성
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    migrate(db, { migrationsFolder: './drizzle' });

    sqlite.close();
    console.log('[Migration] SQLite migration completed!');
  }
}

runMigration().catch((err) => {
  console.error('[Migration] Error:', err);
  process.exit(1);
});
