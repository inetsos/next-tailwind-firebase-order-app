import { Suspense } from "react";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';
import type { Metadata } from 'next';
import ErrorBoundaryClient from '@/components/ErrorBoundaryClient';
import GlobalErrorSetup from '@/components/GlobalErrorSetup';     
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: '지역 커뮤니티 - 시지 라이프',
  description: 'Next.js + Tailwind Layout Example',
  verification: {
    google: 'f6qg1AVUd-2giHuyqps-X1yc7J1B0-ZNQi5p-j9DDaA',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col min-h-screen">
        <CartProvider>
          <Suspense fallback={<div>로딩 중...</div>}>        
            <Navbar />
          </Suspense>

          {/* 네비게이션 고정으로 인한 본문 밀림 방지용 padding-top 추가 */}
          <ErrorBoundaryClient>
            <main className="flex-1 w-full  max-w-lg mx-auto px-1 sm:px-2">
              {children}
            </main>
          </ErrorBoundaryClient>

          <Footer />
        </CartProvider>
        
        <GlobalErrorSetup />
      </body>
    </html>
  );
}
