'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { motion } from 'framer-motion'
import MessageBubble from './MessageBubble'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  error?: boolean
  attachments?: Array<{ id: string; name: string; type: string; size: number }>
}

interface ChatWindowProps {
  sessionId?: string
  messages?: Message[]
  isLoading?: boolean
}

/**
 * Check if reduced-motion is preferred (SSR-safe).
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export default function ChatWindow({ 
  sessionId, 
  messages: propMessages, 
  isLoading = false 
}: ChatWindowProps) {
  const { messages: storeMessages, loading, setCurrentSessionId, currentSessionId } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)
  
  // Use prop messages if provided, otherwise adapt the canonical chat store shape.
  const activeMessages = useMemo(() => {
    const messages = propMessages ?? storeMessages.map((message) => ({
      id: message.id,
      role: message.type === 'user' ? 'user' as const : 'assistant' as const,
      content: message.content,
      isStreaming: message.isStreaming,
      error: message.error,
      attachments: undefined,
    }))
    return Array.isArray(messages) ? messages : []
  }, [propMessages, storeMessages])
  
  const sessionLoadedRef = useRef(false)

  // Load session when sessionId prop changes
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId && !sessionLoadedRef.current) {
      sessionLoadedRef.current = true
      setCurrentSessionId(sessionId)
    }
    
    return () => {
      if (sessionId !== currentSessionId) {
        sessionLoadedRef.current = false
      }
    }
  }, [sessionId, currentSessionId, setCurrentSessionId])

  // Smart auto-scroll: only scroll if user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 150
    isNearBottom.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < threshold
  }, [])

  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      })
    }
  }, [activeMessages])

  // Show loading state with skeleton
  if (isLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center w-full max-w-md px-6">
          <div className="space-y-4">
            <div className="skeleton h-10 w-3/4 mx-auto" />
            <div className="skeleton h-6 w-1/2 mx-auto" />
            <div className="skeleton h-16 w-full" />
          </div>
          <p className="text-gray-400 text-sm mt-4">Loading messages…</p>
        </div>
      </div>
    )
  }

  // Show empty state
  if (!activeMessages || activeMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md px-6"
        >
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Nexora AI</h2>
          <p className="text-gray-400 text-sm">
            Upload documents and ask questions. Your AI agent will search through your knowledge base to provide accurate answers.
          </p>
          {sessionId && (
            <p className="text-xs text-gray-500 mt-4">
              Session ID: {sessionId.slice(0, 8)}...
            </p>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 scrollbar-thin"
    >
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {activeMessages.map((message) => (
          <MessageBubble key={message.id} message={message as any} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
