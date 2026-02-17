import type { Metadata } from 'next';
import { Providers } from './providers';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: 'Log-Shot - 사진 아카이빙 솔루션',
  description: '촬영한 순간을 완벽하게 보존하는 PWA 아카이빙 솔루션',
  manifest: '/manifest.json',
  themeColor: '#121212',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Log-Shot',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
