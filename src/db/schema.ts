/**
 * Drizzle ORM Schema (SQLite)
 * SQLite와 Supabase(PostgreSQL) 모두 호환되도록 설계
 *
 * 타입 매핑:
 * - UUID → TEXT (SQLite) / UUID (PostgreSQL)
 * - JSONB → TEXT (SQLite) / JSONB (PostgreSQL)
 * - TIMESTAMP → INTEGER (SQLite Unix timestamp) / TIMESTAMP (PostgreSQL)
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// 헬퍼: 현재 Unix timestamp
const now = () => Math.floor(Date.now() / 1000);

// Projects (해시태그 그룹)
export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name', { length: 100 }).notNull(),
    hashtag: text('hashtag', { length: 50 }).notNull().unique(),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    hashtagIdx: index('hashtag_idx').on(table.hashtag),
  })
);

// Photos (사진 메타데이터)
export const photos = sqliteTable(
  'photos',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),

    // 원본 파일 정보
    originalFileName: text('original_file_name', { length: 255 }).notNull(),
    compressedUrl: text('compressed_url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    fileSize: integer('file_size').notNull(),

    // EXIF 데이터 (JSON TEXT로 저장)
    exifData: text('exif_data', { mode: 'json' }),

    // 사용자 편집 가능한 날짜/시간
    capturedAt: integer('captured_at', { mode: 'timestamp' }).notNull(),
    displayDate: integer('display_date', { mode: 'timestamp' }).notNull(),

    // 태그 (JSON TEXT로 저장)
    tags: text('tags', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),

    // 보정 정보 (JSON TEXT로 저장)
    adjustments: text('adjustments', { mode: 'json' }),

    // 상태
    isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),

    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    projectIdIdx: index('project_id_idx').on(table.projectId),
    capturedAtIdx: index('captured_at_idx').on(table.capturedAt),
    displayDateIdx: index('display_date_idx').on(table.displayDate),
    isDeletedIdx: index('is_deleted_idx').on(table.isDeleted),
  })
);

// Edit History (편집 이력 추적)
export const editHistory = sqliteTable(
  'edit_history',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    photoId: text('photo_id')
      .references(() => photos.id, { onDelete: 'cascade' })
      .notNull(),

    // 편집 내용
    editType: text('edit_type', { length: 50 }).notNull(),
    oldValue: text('old_value', { mode: 'json' }),
    newValue: text('new_value', { mode: 'json' }),

    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    photoIdIdx: index('edit_history_photo_id_idx').on(table.photoId),
    createdAtIdx: index('edit_history_created_at_idx').on(table.createdAt),
  })
);

// Saved Files (저장된 파일 상태 추적)
export const savedFiles = sqliteTable(
  'saved_files',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    photoId: text('photo_id')
      .references(() => photos.id, { onDelete: 'cascade' })
      .notNull(),

    // 다운로드/저장 정보
    downloadedAt: integer('downloaded_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    fileFormat: text('file_format', { length: 20 }).notNull(),
    appliedAdjustments: text('applied_adjustments', { mode: 'json' }),

    // 상태 표시용
    status: text('status', { length: 20 }).default('saved'),
  },
  (table) => ({
    photoIdIdx: index('saved_files_photo_id_idx').on(table.photoId),
  })
);

// IndexedDB Queue (오프라인 업로드 대기열)
export const uploadQueue = sqliteTable(
  'upload_queue',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

    // 업로드할 파일 정보
    localFileId: text('local_file_id', { length: 255 }).notNull(),
    projectId: text('project_id').references(() => projects.id),

    // 메타데이터
    exifData: text('exif_data', { mode: 'json' }),
    capturedAt: integer('captured_at', { mode: 'timestamp' }).notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),

    // 상태
    status: text('status', { length: 20 }).default('pending'),
    retryCount: integer('retry_count').default(0),
    lastError: text('last_error'),

    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    statusIdx: index('upload_queue_status_idx').on(table.status),
    localFileIdIdx: index('upload_queue_local_file_id_idx').on(table.localFileId),
  })
);

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  project: one(projects, {
    fields: [photos.projectId],
    references: [projects.id],
  }),
  editHistory: many(editHistory),
  savedFiles: many(savedFiles),
}));

export const editHistoryRelations = relations(editHistory, ({ one }) => ({
  photo: one(photos, {
    fields: [editHistory.photoId],
    references: [photos.id],
  }),
}));

export const savedFilesRelations = relations(savedFiles, ({ one }) => ({
  photo: one(photos, {
    fields: [savedFiles.photoId],
    references: [photos.id],
  }),
}));

// Types
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

export type EditHistory = typeof editHistory.$inferSelect;
export type NewEditHistory = typeof editHistory.$inferInsert;

export type SavedFile = typeof savedFiles.$inferSelect;
export type NewSavedFile = typeof savedFiles.$inferInsert;

export type UploadQueue = typeof uploadQueue.$inferSelect;
export type NewUploadQueue = typeof uploadQueue.$inferInsert;
