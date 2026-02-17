# JWT 인증 활성화 가이드

Log-Shot은 기본적으로 JWT 인증이 **비활성화**되어 있습니다. 프로덕션 배포 시 JWT를 활성화하려면 아래 가이드를 따르세요.

## 1. JWT 라이브러리 설치

\`\`\`bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
\`\`\`

## 2. 환경 변수 설정

\`.env\` 파일에 JWT Secret 추가:

\`\`\`env
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
\`\`\`

**주의**: 프로덕션에서는 반드시 강력한 랜덤 문자열을 사용하세요!

생성 방법:
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

## 3. JWT 유틸리티 함수 작성

\`src/lib/jwt.ts\` 파일 생성:

\`\`\`typescript
import jwt from 'jsonwebtoken';
import { JWT } from '@/src/constants';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * JWT 토큰 생성
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT.EXPIRES_IN,
  });
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * 쿠키에서 토큰 추출
 */
export function extractTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(\`\${JWT.COOKIE_NAME}=([^;]+)\`));
  return match ? match[1] : null;
}
\`\`\`

## 4. Middleware 활성화

\`src/middleware.ts\`의 주석을 해제:

\`\`\`typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';
import { JWT } from './constants';

const PROTECTED_PATHS = ['/api/photos', '/api/projects', '/api/upload'];
const PUBLIC_PATHS = ['/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    // 토큰 추출
    const token =
      request.cookies.get(JWT.COOKIE_NAME)?.value ||
      request.headers.get(JWT.HEADER_NAME)?.replace(\`\${JWT.TOKEN_PREFIX} \`, '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      // 토큰 검증
      const decoded = verifyToken(token);

      // 사용자 정보를 헤더에 추가 (API 라우트에서 사용)
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-email', decoded.email);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
\`\`\`

## 5. 로그인 API 구현

\`app/api/auth/login/route.ts\` 생성:

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/src/lib/jwt';
import { JWT } from '@/src/constants';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // TODO: 실제 사용자 인증 로직 구현
    // 예: DB에서 사용자 조회, 비밀번호 검증

    // 임시 예제 (실제로는 DB 조회 필요)
    if (email === 'user@example.com' && password === 'password') {
      const token = signToken({
        userId: '1',
        email,
      });

      const response = NextResponse.json({
        success: true,
        data: { token },
      });

      // 쿠키에 토큰 설정
      response.cookies.set(JWT.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
\`\`\`

## 6. 로그아웃 API 구현

\`app/api/auth/logout/route.ts\` 생성:

\`\`\`typescript
import { NextResponse } from 'next/server';
import { JWT } from '@/src/constants';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete(JWT.COOKIE_NAME);

  return response;
}
\`\`\`

## 7. 프론트엔드에서 토큰 사용

### 로그인 Hook

\`src/hooks/useAuth.ts\` 생성:

\`\`\`typescript
import { useMutation } from '@tanstack/react-query';

interface LoginCredentials {
  email: string;
  password: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) throw new Error('Login failed');

      return response.json();
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Logout failed');

      return response.json();
    },
  });
}
\`\`\`

### API 요청에 토큰 포함

\`src/lib/api.ts\` 생성:

\`\`\`typescript
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // 쿠키가 자동으로 포함되므로 별도 작업 불필요
  // 또는 Authorization 헤더 사용
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // 쿠키 포함
  });

  if (response.status === 401) {
    // 토큰 만료 시 로그인 페이지로 리다이렉트
    window.location.href = '/login';
  }

  return response;
}
\`\`\`

## 8. API 라우트에서 사용자 정보 추출

\`app/api/photos/route.ts\` 예시:

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Middleware에서 설정한 헤더에서 사용자 정보 추출
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');

  // userId를 사용하여 해당 사용자의 사진만 조회
  // ...
}
\`\`\`

## 9. 사용자 테이블 추가 (선택)

\`src/db/schema.ts\`에 users 테이블 추가:

\`\`\`typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(), // bcrypt 해시 저장
  name: varchar('name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// photos 테이블에 userId 추가
export const photos = pgTable('photos', {
  // ... 기존 필드
  userId: uuid('user_id').references(() => users.id).notNull(),
});
\`\`\`

비밀번호 해싱:

\`\`\`bash
npm install bcrypt
npm install -D @types/bcrypt
\`\`\`

\`\`\`typescript
import bcrypt from 'bcrypt';

// 회원가입 시
const hashedPassword = await bcrypt.hash(password, 10);

// 로그인 시
const isValid = await bcrypt.compare(password, user.password);
\`\`\`

## 보안 주의사항

1. **JWT Secret**: 절대 공개 저장소에 커밋하지 마세요
2. **HTTPS**: 프로덕션에서는 반드시 HTTPS를 사용하세요
3. **HttpOnly Cookie**: XSS 공격 방지를 위해 httpOnly 설정 필수
4. **Refresh Token**: 장기간 로그인 유지가 필요하면 Refresh Token 구현 고려
5. **Rate Limiting**: 로그인 API에 Rate Limiting 적용 권장

## 테스트

1. 로그인 테스트:
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"password"}'
\`\`\`

2. 인증 필요 API 테스트:
\`\`\`bash
curl http://localhost:3000/api/photos \\
  -H "Cookie: logshot-token=YOUR_TOKEN"
\`\`\`

## 문제 해결

- **401 Unauthorized**: 토큰이 없거나 만료됨
- **403 Forbidden**: 토큰은 유효하지만 권한 없음
- **토큰이 쿠키에 저장되지 않음**: httpOnly, secure, sameSite 설정 확인

추가 질문이 있으면 이슈를 등록해주세요!
