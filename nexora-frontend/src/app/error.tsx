'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error securely
    logger.error('Unhandled app error caught by global boundary', { error })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0C12] text-[#E5E7EB] p-4 text-center">
      <div className="mb-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Something went wrong!</h2>
        <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-8">
          We encountered an unexpected error while trying to render this page.
          Our team has been notified.
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-[#6366f1] text-white rounded-lg font-medium hover:bg-[#4f46e5] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
