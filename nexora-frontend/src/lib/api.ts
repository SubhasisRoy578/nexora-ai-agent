// src/lib/api.ts

import { logger } from './logger'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const BASE = API_BASE

const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
})

const DEFAULT_TIMEOUT_MS = 30000 // 30 seconds

async function fetchJsonWithFallback<T>(paths: string[], init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  let lastError: unknown
  
  for (const path of paths) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort('TimeoutError'), timeoutMs)
      
      const res = await fetch(`${BASE}${path}`, {
        ...init,
        signal: init.signal || controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!res.ok) {
        lastError = new Error(`Request failed: ${res.status}`)
        logger.warn(`API fallback failed for ${path}`, { status: res.status })
        continue
      }
      return res.json() as Promise<T>
    } catch (error) {
      lastError = error
      logger.warn(`API request error for ${path}`, { error })
    }
  }
  
  logger.error('All API fallbacks failed', { paths, error: lastError })
  throw lastError instanceof Error ? lastError : new Error('API request failed')
}

export interface ChatApiResponse {
  success?: boolean
  response?: string
  ai_response?: string
  provider_used?: string
  provider?: string
  sources?: string[]
  history_count?: number
}

// ──── CHAT (Streaming-compatible Generator) ────
export async function* streamChat(
  message: string,
  tools: string[] = [],
  token?: string,
  userId = 'anonymous',
  provider?: string,
  abortSignal?: AbortSignal
) {
  const payload = { user_id: userId, message, tools, provider }

  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
    signal: abortSignal,
  })

  if (res.ok && res.body) {
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        yield decoder.decode(value)
      }
      return
    }

    const data = (await res.json()) as ChatApiResponse
    yield data.response ?? data.ai_response ?? ''
    return
  }

  const fallback = await fetchJsonWithFallback<ChatApiResponse>(['/api/chat/chat', '/chat/'], {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
    signal: abortSignal,
  })
  yield fallback.response ?? fallback.ai_response ?? ''
}

// ──── UPLOAD ────
export const uploadDocument = async (file: File, token?: string) => {
  const form = new FormData()
  form.append('file', file)

  try {
    const res = await fetch(`${BASE}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    })

    if (!res.ok) {
      logger.error('Upload failed', { status: res.status, fileName: file.name })
      throw new Error(`Upload error: ${res.status}`)
    }
    return res.json()
  } catch (error) {
    logger.error('Upload request exception', { error, fileName: file.name })
    throw error
  }
}

// ──── AGENTS ────
export const getAgents = async (token?: string) => fetchJsonWithFallback(['/api/agents', '/api/agents/tools'], { headers: getHeaders(token) })

export const runAgent = async (agentId: string, task: string, token?: string) =>
  fetchJsonWithFallback(['/api/agents/run', '/api/agents/run/stream'], {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ agent_id: agentId, task }),
  })

// ──── KNOWLEDGE ────
export const getKnowledge = async (token?: string) => fetchJsonWithFallback(['/api/knowledge', '/api/rag/documents'], { headers: getHeaders(token) })

export const deleteDoc = async (docId: string, token?: string) =>
  fetchJsonWithFallback([`/api/knowledge/${docId}`, `/api/rag/documents/${docId}`], {
    method: 'DELETE',
    headers: getHeaders(token),
  })

// ──── ANALYTICS ────
export const getAnalytics = async (token?: string) => fetchJsonWithFallback(['/api/analytics', '/api/analytics/dashboard'], { headers: getHeaders(token) })

// ──── WEBSOCKET (Agent Activity) ────
export const connectAgentSocket = (
  onMessage: (data: any) => void,
  onError?: (e: Event) => void
) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const cleanHost = BASE.replace(/^https?:\/\//, '')
  const ws = new WebSocket(`${protocol}://${cleanHost}/ws/agent-activity`)

  ws.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data))
    } catch {
      onMessage(e.data)
    }
  }
  ws.onerror = (e) => onError?.(e)
  return ws
}

export const uploadFile = uploadDocument

export async function streamChatWithCallback(params: {
  message: string
  tools: string[]
  token?: string
  userId?: string
  provider?: string
  onToken: (token: string) => void
  onDone: () => void
  onError: (err: string) => void
}) {
  const { message, tools, token, userId, provider, onToken, onDone, onError } = params

  try {
    for await (const chunk of streamChat(message, tools, token, userId, provider)) {
      onToken(chunk)
    }
    onDone()
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Stream error')
  }
}

export { streamChat as streamChatGenerator }

export async function sendMessageToAI(message: string, model: string) {
  const chunks: string[] = []
  for await (const chunk of streamChat(message, [], undefined, 'anonymous', model)) {
    chunks.push(chunk)
  }
  return { response: chunks.join('') }
}
