// components/GlobalErrorSetup.tsx
'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandler } from '@/utils/setupGlobalErrorHandler'

export default function GlobalErrorSetup() {
  useEffect(() => {
    setupGlobalErrorHandler()
  }, [])

  return null
}
