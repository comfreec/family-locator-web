import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '가족 위치 공유',
  description: '가족과 실시간으로 위치를 공유하세요',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
