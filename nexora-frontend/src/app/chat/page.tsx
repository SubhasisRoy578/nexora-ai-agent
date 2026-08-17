'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useState, useRef } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import toast from 'react-hot-toast'
import ChatWindow from '../../features/chat/components/ChatWindow'
import ChatInput from '../../features/chat/components/ChatInput'
import WorkspaceLayout from '../../components/layout/WorkspaceLayout'
import { useChatStore } from '@/store/chatStore'
import { streamChat, uploadDocument } from '@/lib/api'

export default function ChatPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { addMessage, updateMessage, messages } = useChatStore()
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleSend = useCallback(async (text: string, files: File[], tools: string[] = ['rag']) => {
    if (isStreaming) return
    setIsStreaming(true)

    const token = await getToken()
    const userId = user?.id ?? 'anonymous'

    // Upload files
    let fileContext = ''
    if (files.length) {
      try {
        const uploads = await Promise.all(files.map(f => uploadDocument(f, token ?? undefined)))
        fileContext = uploads.map(u => `[Uploaded: ${u.name}]`).join(' ')
        toast.success(`${files.length} file(s) uploaded`)
      } catch (err) {
        toast.error('Upload failed')
      }
    }

    const fullMessage = fileContext ? `${fileContext}\n${text}` : text

    // Add user message
    addMessage({ type: 'user', content: fullMessage })

    // Add assistant placeholder
    const assistantId = addMessage({
      type: 'ai',
      content: '',
      isStreaming: true
    })

    let buffer = ''
    try {
      abortRef.current = new AbortController()
      for await (const chunk of streamChat(fullMessage, tools, token ?? undefined, userId, undefined, abortRef.current.signal)) {
        buffer += chunk
        updateMessage(assistantId, { content: buffer, isStreaming: true })
      }
      updateMessage(assistantId, { content: buffer || 'Done.', isStreaming: false })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        updateMessage(assistantId, { content: buffer + '\n\n*(Generation stopped)*', isStreaming: false })
        toast('Generation stopped', { icon: '🛑' })
      } else {
        updateMessage(assistantId, { content: 'Error processing request', isStreaming: false, error: true })
        toast.error('Failed to get response')
      }
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming, getToken, user, addMessage, updateMessage])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const chatWindowMessages = messages.map((message) => ({
    id: message.id,
    role: message.type === 'user' ? 'user' as const : 'assistant' as const,
    content: message.content,
    isStreaming: message.isStreaming,
    error: message.error,
  }))

  return (
    <WorkspaceLayout>
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ChatWindow messages={chatWindowMessages} />
        <ChatInput onSend={handleSend} onStop={handleStop} disabled={isStreaming} isStreaming={isStreaming} />
      </section>
    </WorkspaceLayout>
  )
}
