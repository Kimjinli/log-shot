/**
 * Zod Validation Schemas
 * 모든 폼과 API 요청에 대한 유효성 검사 스키마
 */

import { z } from 'zod';
import { ERROR_MESSAGES } from '@/src/constants';

// ============ 프로젝트 관련 ============
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(100, '프로젝트명은 100자 이내로 입력해주세요.'),
  hashtag: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(50, '해시태그는 50자 이내로 입력해주세요.')
    .regex(/^#[a-zA-Z0-9가-힣_]+$/, '해시태그는 #으로 시작하고 특수문자 없이 입력해주세요.')
    .transform((val) => val.toLowerCase()), // 소문자로 변환
  description: z.string().max(500, '설명은 500자 이내로 입력해주세요.').optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// ============ 사진 업로드 관련 ============
export const photoUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, ERROR_MESSAGES.REQUIRED_FIELD)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      ERROR_MESSAGES.FILE_TOO_LARGE
    )
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      ERROR_MESSAGES.INVALID_FILE_TYPE
    ),
  projectId: z.string().uuid('올바른 프로젝트를 선택해주세요.').optional(),
  capturedAt: z.date({
    required_error: ERROR_MESSAGES.REQUIRED_FIELD,
    invalid_type_error: ERROR_MESSAGES.INVALID_DATE,
  }),
  tags: z.array(z.string().max(20, ERROR_MESSAGES.INVALID_TAG)).default([]),
});

export type PhotoUploadFormData = z.infer<typeof photoUploadSchema>;

// ============ 사진 편집 관련 ============
export const photoEditSchema = z.object({
  displayDate: z.date({
    required_error: ERROR_MESSAGES.REQUIRED_FIELD,
    invalid_type_error: ERROR_MESSAGES.INVALID_DATE,
  }),
  tags: z
    .array(
      z.string().min(1, '태그는 1자 이상 입력해주세요.').max(20, ERROR_MESSAGES.INVALID_TAG)
    )
    .max(10, '태그는 최대 10개까지 추가할 수 있습니다.')
    .default([]),
});

export type PhotoEditFormData = z.infer<typeof photoEditSchema>;

// ============ 화이트밸런스 조정 관련 ============
export const whiteBalanceSchema = z.object({
  temperature: z
    .number()
    .min(-100, '온도는 -100 이상이어야 합니다.')
    .max(100, '온도는 100 이하여야 합니다.'),
  tint: z
    .number()
    .min(-100, '틴트는 -100 이상이어야 합니다.')
    .max(100, '틴트는 100 이하여야 합니다.'),
});

export const adjustmentsSchema = z.object({
  whiteBalance: whiteBalanceSchema.optional(),
  exposure: z.number().min(-2).max(2).optional(),
  contrast: z.number().min(-100).max(100).optional(),
  saturation: z.number().min(-100).max(100).optional(),
  sharpness: z.number().min(0).max(100).optional(),
});

export type AdjustmentsFormData = z.infer<typeof adjustmentsSchema>;

// ============ 날짜 범위 선택 ============
export const dateRangeSchema = z.object({
  startDate: z.date({
    required_error: ERROR_MESSAGES.REQUIRED_FIELD,
    invalid_type_error: ERROR_MESSAGES.INVALID_DATE,
  }),
  endDate: z.date({
    required_error: ERROR_MESSAGES.REQUIRED_FIELD,
    invalid_type_error: ERROR_MESSAGES.INVALID_DATE,
  }),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: '종료일은 시작일보다 이후여야 합니다.',
    path: ['endDate'],
  }
);

export type DateRangeFormData = z.infer<typeof dateRangeSchema>;

// ============ 검색 필터 ============
export const searchFilterSchema = z.object({
  query: z.string().max(100, '검색어는 100자 이내로 입력해주세요.').optional(),
  projectId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sortBy: z.enum(['capturedAt', 'displayDate', 'createdAt', 'updatedAt']).default('displayDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type SearchFilterFormData = z.infer<typeof searchFilterSchema>;

// ============ 태그 입력 검증 ============
export const tagSchema = z
  .string()
  .min(1, '태그는 1자 이상 입력해주세요.')
  .max(20, ERROR_MESSAGES.INVALID_TAG)
  .regex(/^[a-zA-Z0-9가-힣\s]+$/, '태그는 특수문자 없이 입력해주세요.');

// ============ API Response 스키마 ============
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      hasMore: z.boolean(),
    }),
    error: z.string().optional(),
  });

// ============ EXIF 데이터 스키마 ============
export const exifDataSchema = z.object({
  dateTime: z.string().optional(),
  camera: z.string().optional(),
  lens: z.string().optional(),
  iso: z.number().optional(),
  aperture: z.string().optional(),
  shutterSpeed: z.string().optional(),
  focalLength: z.string().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      altitude: z.number().optional(),
    })
    .optional(),
  orientation: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type ExifData = z.infer<typeof exifDataSchema>;
