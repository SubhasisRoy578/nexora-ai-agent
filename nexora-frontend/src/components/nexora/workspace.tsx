"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { ChatArea } from "./chat-area"
import { ActivityPanel } from "./activity-panel"
import {
  BASE_ACTIVITY,
  MODELS,
  SESSIONS,
  type ActivityLog,
  type ChatMessage,
  type ChatSession,
  type ModelOption,
  type ToolId,
} from "@/lib/nexora-data"
import { TOOL_META } from "./tool-config"

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

export function Workspace() {
  const [sessions, setSessions] = useState<ChatSession[]>(SESSIONS)
  const [activeId, setActiveId] = useState<string>(SESSIONS[0].id)
  const [model, setModel] = useState<ModelOption>(MODELS[0]) // Groq pre-selected
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [activeTools, setActiveTools] = useState<Set<ToolId>>(new Set<ToolId>(["rag"]))
  const [logs, setLogs] = useState<ActivityLog[]>(BASE_ACTIVITY)
  const [busy, setBusy] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0]

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("light", theme === "light")
    root.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout)
  }, [])

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
    const session: ChatSession = {
      id: uid(),
      title: "New session",
      preview: "Start a new conversation…",
      updatedAt: "now",
      messages: [],
    }
    setSessions((prev) => [session, ...prev])
    setActiveId(session.id)
    setLogs([
      { id: uid(), kind: "info", label: "Session initialized", detail: "Fresh context window", time: nowStamp() },
    ])
    setSidebarOpen(false)
  }, [])

  const handleSelect = useCallback((id: string) => {
    setActiveId(id)
    setSidebarOpen(false)
  }, [])

  const handleSend = useCallback(
    (text: string) => {
      if (busy) return
      const tools = Array.from(activeTools)
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: text,
        timestamp: nowTime(),
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? {
                ...s,
                title: s.messages.length === 0 ? text.slice(0, 42) : s.title,
                preview: text.slice(0, 60),
                updatedAt: "now",
                messages: [...s.messages, userMsg],
              }
            : s,
        ),
      )

      setBusy(true)
      setActivityOpen(true)
      pushLog({ kind: "thinking", label: "Agent reasoning", detail: "Parsing intent · planning steps" })

      const steps: { delay: number; log: Omit<ActivityLog, "id" | "time"> }[] = []
      let delay = 600

      if (tools.includes("rag")) {
        steps.push({ delay, log: { kind: "rag", label: "Querying knowledge base", detail: "vector-index/prod · top_k=8" } })
        delay += 700
      }
      if (tools.includes("search")) {
        steps.push({ delay, log: { kind: "search", label: "Searching the web", detail: `query: ${text.slice(0, 28)}…`, progress: 100 } })
        delay += 700
      }
      if (tools.includes("code")) {
        steps.push({ delay, log: { kind: "code", label: "Code interpreter", detail: "Executing sandbox · py3.12" } })
        delay += 700
      }
      steps.push({ delay, log: { kind: "tool", label: "Tool call: semantic_search", detail: "recall@10 0.94 · 8 hits" } })
      delay += 600

      steps.forEach(({ delay: d, log }) => {
        timers.current.push(setTimeout(() => pushLog(log), d))
      })

      timers.current.push(
        setTimeout(() => {
          const toolNames = tools.length
            ? tools.map((t) => TOOL_META[t].label).join(", ")
            : "no external tools"
          const reply: ChatMessage = {
            id: uid(),
            role: "assistant",
            tools,
            content: `I worked through that using ${toolNames}.\n\nHere's my synthesized take on "${text.slice(0, 64)}${
              text.length > 64 ? "…" : ""
            }":\n\n• I decomposed the request into discrete sub-tasks and routed each to the most capable tool.\n• Retrieved supporting context and ranked it by relevance before composing the answer.\n• Final response is grounded in the highest-confidence sources — ask me to expand any point or drill into the underlying citations.`,
            timestamp: nowTime(),
          }
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeId ? { ...s, messages: [...s.messages, reply], updatedAt: "now" } : s,
            ),
          )
          pushLog({ kind: "success", label: "Response synthesized", detail: `${model.provider} · ${(delay / 1000).toFixed(1)}s` })
          setBusy(false)
        }, delay + 700),
      )
    },
    [activeId, activeTools, busy, model.provider, pushLog],
  )

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

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
        <ChatArea
          title={activeSession.messages.length === 0 ? "How can Nexora help?" : activeSession.title}
          messages={activeSession.messages}
          activeTools={activeTools}
          onToggleTool={toggleTool}
          onSend={handleSend}
          busy={busy}
        />
      </div>

      <ActivityPanel
        logs={logs}
        busy={busy}
        model={model.provider}
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
      />
    </div>
  )
}
