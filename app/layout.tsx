// app/layout.tsx
import { Suspense } from "react";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';
import type { Metadata } from 'next';
// 클라이언트 에러 바운더리
import ErrorBoundaryClient from '@/components/ErrorBoundaryClient';
// window.onerror 등 감지용
import GlobalErrorSetup from '@/components/GlobalErrorSetup';     
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: '지역 커뮤니티 - 시지 라이프',
  description: 'Next.js + Tailwind Layout Example',
}

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
            <main className="flex-1 container mx-auto px-4 py-2 pt-0">
              {children}                  
            </main>
          </ErrorBoundaryClient>

          <Footer />
        </CartProvider>
        
        <GlobalErrorSetup />
      </body>
    </html>
  )
}
