/**
 * Drizzle ORM Database Instance (SQLite)
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// SQLite 데이터베이스 파일 경로
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'sqlite.db');

// SQLite 연결 (Singleton)
let _sqlite: Database.Database | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

// Singleton 패턴으로 DB 연결 관리
function getDatabase() {
  if (!_db) {
    // 디렉토리 생성 (data 폴더)
    const fs = require('fs');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    _sqlite = new Database(dbPath);

    // WAL 모드 활성화 (성능 향상)
    _sqlite.pragma('journal_mode = WAL');

    // Foreign Key 활성화
    _sqlite.pragma('foreign_keys = ON');

    _db = drizzle(_sqlite, { schema });

    console.log('[DB] SQLite connected:', dbPath);
  }

  return _db;
}

function getSqlite() {
  if (!_sqlite) {
    getDatabase(); // DB 초기화
  }
  return _sqlite!;
}

// Export
export const db = getDatabase();
export const sqlite = getSqlite();
export * from './schema';

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    if (_sqlite) {
      _sqlite.close();
      console.log('[DB] SQLite connection closed');
    }
    process.exit(0);
  });
}
