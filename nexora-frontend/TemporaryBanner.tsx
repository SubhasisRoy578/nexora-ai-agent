// src/components/TemporaryBanner.tsx
import React from 'react'

export default function TemporaryBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2">
      <p className="text-amber-400 text-sm text-center">
        ⚡ Temporary Mode • Your conversations will not be saved
      </p>
    </div>
  )
}