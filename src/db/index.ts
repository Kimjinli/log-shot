/**
 * Drizzle ORM Database Instance
 * 환경에 따라 자동으로 SQLite 또는 PostgreSQL 선택
 */

import * as schema from './schema';

// 환경 감지
const isProduction = process.env.NODE_ENV === 'production';
const hasPostgresUrl = process.env.DATABASE_URL?.startsWith('postgres');
const usePostgres = isProduction && hasPostgresUrl;

let db: any;

if (usePostgres) {
  // PostgreSQL (Vercel 배포)
  const { drizzle } = require('drizzle-orm/postgres-js');
  const postgres = require('postgres');

  const connectionString = process.env.DATABASE_URL!;
  const sql = postgres(connectionString);
  db = drizzle(sql, { schema });

  console.log('[DB] PostgreSQL connected (Production)');
} else {
  // SQLite (로컬 개발)
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'sqlite.db');

  // 디렉토리 생성
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);

  // WAL 모드 활성화 (성능 향상)
  sqlite.pragma('journal_mode = WAL');

  // Foreign Key 활성화
  sqlite.pragma('foreign_keys = ON');

  db = drizzle(sqlite, { schema });

  console.log('[DB] SQLite connected (Development):', dbPath);

  // Graceful shutdown for SQLite
  if (typeof process !== 'undefined') {
    process.on('SIGINT', () => {
      sqlite.close();
      console.log('[DB] SQLite connection closed');
      process.exit(0);
    });
  }
}

export { db };
export * from './schema';
