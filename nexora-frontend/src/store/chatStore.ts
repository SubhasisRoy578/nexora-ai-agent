// src/stores/chatStore.ts
import { create } from 'zustand'
import { streamChat } from '../lib/api'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  tools?: string[]
  timestamp: Date
  sessionId?: string
  isStreaming?: boolean  // ← ADDED for streaming state
  error?: boolean        // ← ADDED for error state
}

interface ChatStore {
  // State
  messages: Message[]
  loading: boolean
  error: string | null
  isTemporaryMode: boolean
  currentSessionId: string | null
  
  // Actions
  sendMessage: (text: string, tools: string[]) => Promise<void>
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string  // ← ADDED
  updateMessage: (id: string, updates: Partial<Message>) => void      // ← ADDED
  clear: () => void
  setError: (e: string | null) => void
  setIsTemporaryMode: (value: boolean) => void
  setCurrentSessionId: (id: string | null) => void
  loadSession: (sessionId: string) => Promise<void>
}

let msgId = 0
const genId = () => `msg_${++msgId}`

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  messages: [],
  loading: false,
  error: null,
  isTemporaryMode: false,
  currentSessionId: null,

  // Add a new message manually
  addMessage: (message) => {
    const id = genId()
    const newMessage: Message = {
      id,
      type: message.type,
      content: message.content,
      tools: message.tools || [],
      timestamp: new Date(),
      sessionId: get().currentSessionId || undefined,
      isStreaming: message.isStreaming || false,
      error: message.error || false,
    }
    set((state) => ({
      messages: [...state.messages, newMessage]
    }))
    return id
  },

  // Update an existing message by ID
  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      )
    }))
  },

  // Send message with streaming
  sendMessage: async (text: string, tools: string[]) => {
    const { currentSessionId } = get()
    
    set({ loading: true, error: null })
    
    // Add user message
    set((s) => ({
      messages: [...s.messages, {
        id: genId(),
        type: 'user',
        content: text,
        timestamp: new Date(),
        sessionId: currentSessionId || undefined,
      }],
    }))

    try {
      let aiResponse = ''
      const aiMsgId = genId()
      const aiMsg = { 
        id: aiMsgId, 
        type: 'ai' as const, 
        content: '', 
        tools, 
        timestamp: new Date(),
        sessionId: currentSessionId || undefined,
        isStreaming: true,
      }
      set((s) => ({ messages: [...s.messages, aiMsg] }))

      // Stream AI response
      for await (const chunk of streamChat(text, tools)) {
        aiResponse += chunk
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === aiMsgId ? { ...m, content: aiResponse, isStreaming: true } : m
          ),
        }))
      }
      
      // Mark as complete
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === aiMsgId ? { ...m, isStreaming: false } : m
        ),
      }))
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      set({ error: errMsg })
    } finally {
      set({ loading: false })
    }
  },

  // Clear all messages
  clear: () => set({ 
    messages: [], 
    error: null, 
    loading: false,
    currentSessionId: null,
    isTemporaryMode: false,
  }),
  
  // Set error message
  setError: (error) => set({ error }),
  
  // Set temporary mode (for guest/unauthenticated users)
  setIsTemporaryMode: (value: boolean) => set({ isTemporaryMode: value }),
  
  // Set current session ID
  setCurrentSessionId: (id: string | null) => set({ currentSessionId: id }),
  
  // Load previous session messages (from backend)
  loadSession: async (sessionId: string) => {
    set({ loading: true, error: null, currentSessionId: sessionId })
    try {
      // Fetch messages from backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('Failed to load session')
      
      const data = await response.json()
      const loadedMessages: Message[] = data.messages.map((msg: any, index: number) => ({
        id: genId(),
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        tools: msg.tools || [],
        timestamp: new Date(msg.timestamp || Date.now()),
        sessionId: sessionId,
      }))
      
      set({ messages: loadedMessages, loading: false })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to load session'
      set({ error: errMsg, loading: false })
    }
  },
}))
