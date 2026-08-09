'use client'

import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'

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

export default function ChatWindow({ 
  sessionId, 
  messages: propMessages, 
  isLoading = false 
}: ChatWindowProps) {
  const { messages: storeMessages, loading, setCurrentSessionId, currentSessionId } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  
  // Use prop messages if provided, otherwise use store messages
  const messages = propMessages || storeMessages
  const activeMessages = Array.isArray(messages) ? messages : []
  
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  // Show loading state
  if (isLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading messages...</p>
        </div>
      </div>
    )
  }

  // Show empty state
  if (!activeMessages || activeMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
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
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {activeMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.error
                  ? 'bg-red-900/50 text-red-300 border border-red-700'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              {message.attachments && message.attachments.length > 0 && (
                <div className="text-xs mb-2 opacity-70">
                  📎 {message.attachments.map(a => a.name).join(', ')}
                </div>
              )}
              <div className="whitespace-pre-wrap">
                {message.content || (message.isStreaming && '...')}
              </div>
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
