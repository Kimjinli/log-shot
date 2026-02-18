/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 이미지 최적화 설정
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Vercel Blob 또는 외부 이미지 도메인 허용
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
    ],
  },

  // SCSS 모듈 지원
  sassOptions: {
    includePaths: ['./styles'],
  },

  // Standalone 모드 활성화 (Electron 및 Vercel 배포용)
  output: 'standalone',

  // 서버 컴포넌트 외부 패키지
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'better-sqlite3'],
  },
}

export default nextConfig
