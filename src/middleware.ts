/**
 * Next.js Middleware
 * JWT 인증 준비 (현재는 Pass-through 모드)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JWT } from './constants';

// JWT 검증이 필요한 경로
const PROTECTED_PATHS = ['/api/photos', '/api/projects', '/api/upload'];

// JWT 검증이 필요 없는 경로
const PUBLIC_PATHS = ['/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public 경로는 그대로 통과
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Protected 경로 체크
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    // ============ JWT 검증 로직 (현재는 비활성화) ============
    // 활성화하려면 아래 주석을 해제하고 JWT 라이브러리 설치 필요
    /*
    const token = request.cookies.get(JWT.COOKIE_NAME)?.value ||
                  request.headers.get(JWT.HEADER_NAME)?.replace(`${JWT.TOKEN_PREFIX} `, '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      // JWT 검증 (jsonwebtoken 라이브러리 필요)
      // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      // request.headers.set('user', JSON.stringify(decoded));
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    */
    // ============ JWT 검증 로직 끝 ============

    // 현재는 Pass-through (모든 요청 허용)
    console.log('[Middleware] JWT auth disabled - allowing request to:', pathname);
  }

  return NextResponse.next();
}

// Middleware가 실행될 경로 설정
export const config = {
  matcher: [
    '/api/:path*',
    // Static files 및 Next.js 내부 경로 제외
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
