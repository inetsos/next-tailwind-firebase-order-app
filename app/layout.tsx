// app/layout.tsx
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import GoogleRedirectHandler from '@/components/GoogleRedirectHandler'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Next.js + Tailwind Layout Example',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kr">
      <body className="min-h-screen flex flex-col">
        <GoogleRedirectHandler /> {/* ✅ 리디렉션 결과 처리 */}
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
