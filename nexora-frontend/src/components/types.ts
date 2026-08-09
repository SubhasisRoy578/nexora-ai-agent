// src/types.ts

// View types for navigation
export type View = 'chat' | 'dashboard' | 'knowledge' | 'settings' | 'analytics' | 'agents' | 'code'

// User type
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

// Theme type
export type Theme = 'dark' | 'light' | 'system'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Tool types for chat
export type ToolType = 'rag' | 'search' | 'code' | 'agent' | 'upload'

// Session type
export interface Session {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
}