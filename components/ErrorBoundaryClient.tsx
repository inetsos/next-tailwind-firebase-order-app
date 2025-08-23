// components/ErrorBoundaryClient.tsx
'use client'

import { Component, ReactNode } from 'react'
import { logEvent } from '@/utils/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundaryClient extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logEvent('error', '에러', 'React 전역 에러', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return <h2 className="text-red-500">문제가 발생했습니다. 새로고침 해주세요.</h2>
    }

    return this.props.children
  }
}
