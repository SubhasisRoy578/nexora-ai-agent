// src/app/dashboard/chat/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useChatStore } from '@/store/chatStore'
import { streamChat, uploadDocument } from '@/lib/api'
import ChatWindow from '@/features/chat/components/ChatWindow'
import ChatInput from '@/features/chat/components/ChatInput'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { 
    addMessage, 
    updateMessage, 
    messages, 
    loading, 
    setCurrentSessionId, 
    currentSessionId 
  } = useChatStore()
  
  const [isUploading, setIsUploading] = useState(false)

  // Create a session ID on mount if needed
  useEffect(() => {
    if (!currentSessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
      setCurrentSessionId(newSessionId)
    }
  }, [currentSessionId, setCurrentSessionId])

  const handleSend = async (text: string, files: File[]) => {
    if (loading || (!text.trim() && files.length === 0)) return

    const token = await getToken()
    const sessionId = currentSessionId || `session_${Date.now()}`

    // Upload files if any
    let fileContext = ''
    if (files.length > 0) {
      setIsUploading(true)
      try {
        const uploadResults = await Promise.all(
          files.map(async (file) => {
            const result = await uploadDocument(file, token ?? undefined)
            return `[Uploaded: ${result.name || file.name}]`
          })
        )
        fileContext = uploadResults.join(' ')
        toast.success(`${files.length} file(s) uploaded successfully`)
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('File upload failed. Proceeding without files.')
      } finally {
        setIsUploading(false)
      }
    }

    const fullMessage = fileContext ? `${fileContext}\n\n${text}` : text

    // Add user message
    addMessage({
      type: 'user',
      content: fullMessage,
    })

    // Add placeholder for AI response
    const assistantMessageId = addMessage({
      type: 'ai',
      content: '',
      isStreaming: true,
    })

    let accumulatedResponse = ''

    try {
      const tools = ['rag']
      for await (const chunk of streamChat(fullMessage, tools, token ?? undefined)) {
        accumulatedResponse += chunk
        updateMessage(assistantMessageId, {
          content: accumulatedResponse,
          isStreaming: true,
        })
      }

      updateMessage(assistantMessageId, {
        content: accumulatedResponse || 'I processed your request.',
        isStreaming: false,
      })
    } catch (error) {
      console.error('Stream error:', error)
      updateMessage(assistantMessageId, {
        content: 'Sorry, an error occurred while processing your request.',
        isStreaming: false,
        error: true,
      })
      toast.error('Failed to get response')
    }
  }

  // Convert messages to the format expected by ChatWindow
  const formattedMessages = messages.map((msg: any) => ({
  id: msg.id,
  role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
  content: msg.content,
  isStreaming: msg.isStreaming,
  error: msg.error,
}))

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 overflow-hidden">
        <ChatWindow 
          messages={formattedMessages}
          isLoading={loading}
        />
      </div>

      <div className="border-t border-gray-800 px-4 py-4">
        <ChatInput 
          onSend={handleSend}
          disabled={loading || isUploading}
        />
      </div>
    </div>
  )
}
