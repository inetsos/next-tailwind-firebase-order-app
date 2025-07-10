'use client'

import { useEffect } from 'react'
import { handleRedirectResultAfterLinking } from '@/hooks/useHandleGoogleRedirectLogin'

export default function GoogleRedirectHandler() {
  useEffect(() => {
    handleRedirectResultAfterLinking()
  }, [])

  return null // 렌더링할 UI는 없음
}
