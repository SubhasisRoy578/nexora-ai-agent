'use client'

import { logger } from '@/lib/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // We can't use useEffect here safely because the layout itself might be broken
  if (typeof window !== 'undefined') {
    logger.error('Critical global error', { error })
  }

  return (
    <html lang="en">
      <body className="bg-[#0A0C12] text-white flex items-center justify-center min-h-screen p-4 text-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">Critical System Error</h2>
          <p className="text-gray-400 mb-6">The application could not be loaded.</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  )
}
