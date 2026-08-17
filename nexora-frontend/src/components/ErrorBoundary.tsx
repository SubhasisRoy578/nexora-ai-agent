'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  name?: string
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`ErrorBoundary caught error in component ${this.props.name || 'Unknown'}`, {
      error,
      componentStack: errorInfo.componentStack
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="p-4 m-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="text-sm font-semibold mb-1">Component Failed to Load</p>
          <p className="text-xs opacity-80">
            An error occurred in this section of the app. Please refresh the page.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
