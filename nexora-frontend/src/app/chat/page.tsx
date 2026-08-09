'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useState } from 'react'
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

  const handleSend = useCallback(async (text: string, files: File[]) => {
    if (isStreaming) return
    setIsStreaming(true)

    const token = await getToken()

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
    addMessage({ 
      type: 'ai',
      content: '', 
      isStreaming: true 
    })

    // Get the ID of the last message (the one we just added)
    const currentMessages = useChatStore.getState().messages
    const assistantId = currentMessages[currentMessages.length - 1]?.id

    let buffer = ''
    try {
      for await (const chunk of streamChat(fullMessage, ['rag'], token ?? undefined)) {
        buffer += chunk
        if (assistantId) {
          updateMessage(assistantId, { content: buffer, isStreaming: true })
        }
      }
      if (assistantId) {
        updateMessage(assistantId, { content: buffer || 'Done.', isStreaming: false })
      }
    } catch (err) {
      if (assistantId) {
        updateMessage(assistantId, { content: 'Error processing request', isStreaming: false, error: true })
      }
      toast.error('Failed to get response')
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming, getToken, addMessage, updateMessage])

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
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </section>
    </WorkspaceLayout>
  )
}
