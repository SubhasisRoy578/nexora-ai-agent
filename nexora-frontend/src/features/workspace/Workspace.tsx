"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { Sidebar } from "@/components/nexora/sidebar"
import { TopBar } from "@/components/nexora/top-bar"
import { ChatArea } from "@/components/nexora/chat-area"
import { ActivityPanel } from "@/components/nexora/activity-panel"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { streamChat } from "@/lib/api"
import { useChatStore } from "@/store/chatStore"
import {
  BASE_ACTIVITY,
  MODELS,
  type ActivityLog,
  type ChatMessage,
  type ChatSession,
  type ModelOption,
  type ToolId,
} from "@/lib/nexora-data"

const WORKSPACE_NAME = "Production · AI Ops"

function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
function nowStamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false })
}
function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const EMPTY_SESSION: ChatSession = {
  id: "default",
  title: "New session",
  preview: "Start a real Nexora conversation…",
  updatedAt: "now",
  messages: [],
}

function toToolIds(tools: string[] = []): ToolId[] {
  return tools.filter((tool): tool is ToolId => ["rag", "search", "code", "agent", "upload"].includes(tool))
}


export function Workspace() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <WorkspaceShell getToken={async () => null} userId="anonymous" />
  }
  return <WorkspaceWithClerk />
}

function WorkspaceWithClerk() {
  const { user } = useUser()
  const { getToken } = useAuth()
  return <WorkspaceShell getToken={getToken} userId={user?.id ?? "anonymous"} />
}

interface WorkspaceShellProps {
  getToken: () => Promise<string | null>
  userId: string
}

function WorkspaceShell({ getToken, userId: currentUserId }: WorkspaceShellProps) {
  const { messages, addMessage, updateMessage, currentSessionId, setCurrentSessionId } = useChatStore()
  const [sessions, setSessions] = useState<ChatSession[]>([EMPTY_SESSION])
  const [activeId, setActiveId] = useState<string>(EMPTY_SESSION.id)
  const [model, setModel] = useState<ModelOption>(MODELS[0])
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [activeTools, setActiveTools] = useState<Set<ToolId>>(new Set<ToolId>(["rag"]))
  const [logs, setLogs] = useState<ActivityLog[]>(BASE_ACTIVITY)
  const [busy, setBusy] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!currentSessionId) setCurrentSessionId(EMPTY_SESSION.id)
  }, [currentSessionId, setCurrentSessionId])

  const uiMessages = useMemo<ChatMessage[]>(() => messages.map((message) => ({
    id: message.id,
    role: message.type === "user" ? "user" : "assistant",
    content: message.content,
    tools: toToolIds(message.tools),
    timestamp: message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : nowTime(),
  })), [messages])

  const activeSession = useMemo<ChatSession>(() => {
    const latestUser = uiMessages.findLast((message) => message.role === "user")
    return {
      ...(sessions.find((s) => s.id === activeId) ?? EMPTY_SESSION),
      title: latestUser?.content.slice(0, 42) || "How can Nexora help?",
      preview: latestUser?.content.slice(0, 60) || "Connected to the Nexora backend",
      updatedAt: uiMessages.length ? "now" : "ready",
      messages: uiMessages,
    }
  }, [activeId, sessions, uiMessages])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("light", theme === "light")
    root.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const toggleTool = useCallback((t: ToolId) => {
    setActiveTools((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }, [])

  const pushLog = useCallback((log: Omit<ActivityLog, "id" | "time">) => {
    setLogs((prev) => [...prev, { ...log, id: uid(), time: nowStamp() }])
  }, [])

  const handleNewChat = useCallback(() => {
    const id = `session_${Date.now()}_${uid()}`
    const session: ChatSession = { ...EMPTY_SESSION, id }
    setSessions((prev) => [session, ...prev])
    setActiveId(id)
    setCurrentSessionId(id)
    setLogs([{ id: uid(), kind: "info", label: "Session initialized", detail: "Fresh backend context window", time: nowStamp() }])
    setSidebarOpen(false)
  }, [setCurrentSessionId])

  const handleSelect = useCallback((id: string) => {
    setActiveId(id)
    setCurrentSessionId(id)
    setSidebarOpen(false)
  }, [setCurrentSessionId])

  const handleSend = useCallback(async (text: string) => {
    if (busy || !text.trim()) return

    const tools = Array.from(activeTools)
    const userId = currentUserId || currentSessionId || "anonymous"
    const token = await getToken().catch(() => null)

    addMessage({ type: "user", content: text, tools })
    const assistantId = addMessage({ type: "ai", content: "", tools, isStreaming: true })

    setBusy(true)
    setActivityOpen(true)
    pushLog({ kind: "thinking", label: "Agent reasoning", detail: "Sending request to Nexora backend" })
    if (tools.includes("rag")) pushLog({ kind: "rag", label: "RAG enabled", detail: "Backend will retrieve context when available" })
    if (tools.includes("search")) pushLog({ kind: "search", label: "Web search enabled", detail: `query: ${text.slice(0, 28)}${text.length > 28 ? "…" : ""}` })
    if (tools.includes("code")) pushLog({ kind: "code", label: "Code tool enabled", detail: "Backend tool orchestration requested" })

    let accumulated = ""
    try {
      for await (const chunk of streamChat(text, tools, token ?? undefined, userId, model.id)) {
        accumulated += chunk
        updateMessage(assistantId, { content: accumulated, isStreaming: true })
      }
      updateMessage(assistantId, { content: accumulated || "Nexora processed your request.", isStreaming: false })
      pushLog({ kind: "success", label: "Response synthesized", detail: `${model.provider} · backend response complete` })
    } catch (error) {
      updateMessage(assistantId, {
        content: "Sorry, Nexora could not complete that request. Please verify the backend is available and try again.",
        isStreaming: false,
        error: true,
      })
      pushLog({ kind: "info", label: "Backend request failed", detail: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setBusy(false)
    }
  }, [activeTools, addMessage, busy, currentSessionId, getToken, model.id, model.provider, pushLog, updateMessage, currentUserId])

  const sidebarSessions = useMemo(() => {
    const current = sessions.map((session) => session.id === activeId ? activeSession : session)
    return current.length ? current : [activeSession]
  }, [activeId, activeSession, sessions])

  return (
    <div className="flex h-dvh overflow-hidden bg-background font-sans text-foreground">
      <ErrorBoundary name="Sidebar">
        <Sidebar
          sessions={[activeSession]}
          activeId={activeSession.id}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </ErrorBoundary>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          workspace={WORKSPACE_NAME}
          model={model}
          onModelChange={setModel}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleActivity={() => setActivityOpen((v) => !v)}
        />
        <ErrorBoundary name="ChatArea">
          <ChatArea
            title={activeSession.messages.length === 0 ? "How can Nexora help?" : activeSession.title}
            messages={activeSession.messages}
            activeTools={activeTools}
            onToggleTool={toggleTool}
            onSend={handleSend}
            busy={busy}
          />
        </ErrorBoundary>
      </div>

      <ErrorBoundary name="ActivityPanel">
        <ActivityPanel
          logs={logs}
          busy={busy}
          model={model.provider}
          open={activityOpen}
          onClose={() => setActivityOpen(false)}
        />
      </ErrorBoundary>
    </div>
  )
}
