import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '업무 리마인더 | Task Reminder',
  description: '할 일을 관리하고 카카오톡으로 리마인더를 받으세요',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Toss Product Sans의 무료 대체 폰트(Pretendard) — tailwind font-sans 스택과 연동 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-sans">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
