"use client"

import { useEffect, useRef } from "react"
import { Hexagon, Database, Globe, Bot } from "lucide-react"
import { MessageBubble } from "./chat-message"
import { ChatInput } from "./chat-input"
import type { ChatMessage, ToolId } from "@/lib/nexora-data"

interface ChatAreaProps {
  title: string
  messages: ChatMessage[]
  activeTools: Set<ToolId>
  onToggleTool: (t: ToolId) => void
  onSend: (text: string) => void
  busy: boolean
}

const SUGGESTIONS = [
  { icon: Database, text: "Summarize our knowledge base on auth flows" },
  { icon: Globe, text: "Research the latest vector DB benchmarks" },
  { icon: Bot, text: "Build an agent to triage inbound support tickets" },
]

export function ChatArea({ title, messages, activeTools, onToggleTool, onSend, busy }: ChatAreaProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, busy])

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-[0.4]" />

      <div className="scrollbar-thin relative flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <EmptyState onSend={onSend} title={title} />
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {busy && <TypingIndicator />}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      <div className="relative border-t border-border bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <ChatInput
          activeTools={activeTools}
          onToggleTool={onToggleTool}
          onSend={onSend}
          busy={busy}
        />
      </div>
    </main>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary glow-ring">
        <Hexagon className="size-4 animate-pulse" strokeWidth={2.5} />
      </div>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">Agent reasoning</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

function EmptyState({
  onSend,
  title,
}: {
  onSend: (t: string) => void
  title: string
}) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary glow-ring">
        <Hexagon className="size-7" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-balance text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-pretty text-sm text-muted-foreground">
        Your AI command center. Arm tools below, then ask Nexora to research, reason, and
        orchestrate multi-step work across your knowledge.
      </p>
      <div className="mt-7 grid w-full max-w-xl gap-2 sm:grid-cols-3">
        {SUGGESTIONS.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onSend(text)}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <Icon className="size-4 text-primary" />
            <span className="text-xs leading-snug text-muted-foreground">{text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
