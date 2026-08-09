"use client"

import { useRef, useState } from "react"
import { ArrowUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { TOOL_META, TOOL_ORDER } from "./tool-config"
import type { ToolId } from "@/lib/nexora-data"

interface ChatInputProps {
  activeTools: Set<ToolId>
  onToggleTool: (t: ToolId) => void
  onSend: (text: string) => void
  busy: boolean
}

export function ChatInput({ activeTools, onToggleTool, onSend, busy }: ChatInputProps) {
  const [value, setValue] = useState("")
  const taRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const text = value.trim()
    if (!text || busy) return
    onSend(text)
    setValue("")
    if (taRef.current) taRef.current.style.height = "auto"
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function autoGrow() {
    const el = taRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Tool chips */}
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        {TOOL_ORDER.map((id) => {
          const meta = TOOL_META[id]
          const Icon = meta.icon
          const active = activeTools.has(id)
          return (
            <button
              key={id}
              onClick={() => onToggleTool(id)}
              title={meta.description}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "border-primary/50 bg-primary/15 text-primary glow-ring"
                  : "border-border bg-secondary/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Input box */}
      <div className="rounded-2xl border border-border bg-card p-2.5 shadow-2xl transition-colors focus-within:border-primary/50 focus-within:glow-ring">
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            autoGrow()
          }}
          onKeyDown={handleKey}
          placeholder="Ask Nexora to research, reason, or orchestrate a tool…"
          className="max-h-40 w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none scrollbar-thin"
        />
        <div className="flex items-center justify-between gap-2 pl-1 pt-1">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            {activeTools.size > 0
              ? `${activeTools.size} tool${activeTools.size > 1 ? "s" : ""} armed`
              : "Press Enter to send"}
          </span>
          <button
            onClick={submit}
            disabled={!value.trim() || busy}
            aria-label="Send message"
            className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="size-4.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Nexora can make mistakes. Verify critical output before acting.
      </p>
    </div>
  )
}
