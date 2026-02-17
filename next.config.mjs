/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // PWA 지원을 위한 설정
  experimental: {
    webpackBuildWorker: true,
  },
  // 이미지 최적화 설정
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  // SCSS 모듈 지원
  sassOptions: {
    includePaths: ['./styles'],
  },
}

export default nextConfig
