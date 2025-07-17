// app/layout.tsx
import { Suspense } from "react";
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './globals.css'
import type { Metadata } from 'next'
// 클라이언트 에러 바운더리
import ErrorBoundaryClient from '@/components/ErrorBoundaryClient';
// window.onerror 등 감지용
import GlobalErrorSetup from '@/components/GlobalErrorSetup';     

export const metadata: Metadata = {
  title: '지역 커뮤니티 - 시지 라이프',
  description: 'Next.js + Tailwind Layout Example',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kr">
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col min-h-screen">
        <Suspense fallback={<div>로딩 중...</div>}>        
          <Navbar />
        </Suspense>

        {/* 클라이언트에서 발생한 React 렌더링 에러를 감지 */}
        <ErrorBoundaryClient>
        <main className="flex-1 container mx-auto px-4 py-2">
          {children}
        </main>
        </ErrorBoundaryClient>

        <Footer />
        
        {/* 전역 window.onerror, unhandledrejection 등을 감지 */}
        <GlobalErrorSetup />
      </body>
    </html>
  )
}

