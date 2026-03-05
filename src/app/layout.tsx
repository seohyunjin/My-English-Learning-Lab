import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'English Learning Lab',
  description: 'AI와 함께하는 영어 회화 학습 사이트',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <nav className="nav">
          <div className="nav-brand">
            <span className="nav-logo">🇬🇧</span>
            <span>English Learning Lab</span>
          </div>
          <div className="nav-links">
            <Link href="/chat" className="nav-link">💬 AI 회화</Link>
            <Link href="/vocabulary" className="nav-link">📖 단어장</Link>
            <Link href="/quiz" className="nav-link">🧩 퀴즈</Link>
          </div>
        </nav>
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
