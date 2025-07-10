'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { handleRedirectResultAfterLinking } from '@/hooks/useHandleGoogleRedirectLogin'

export default function GoogleRedirectHandler() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/mypage') {
      handleRedirectResultAfterLinking()
    }
  }, [])

  return null // 렌더링할 UI는 없음
}
