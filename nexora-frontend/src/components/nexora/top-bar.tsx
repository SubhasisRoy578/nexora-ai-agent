"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Cpu, Menu, Moon, Sun, PanelRightOpen, Check } from "lucide-react"
import { MODELS, type ModelOption } from "@/lib/nexora-data"
import { cn } from "@/lib/utils"

interface TopBarProps {
  workspace: string
  model: ModelOption
  onModelChange: (m: ModelOption) => void
  theme: "dark" | "light"
  onToggleTheme: () => void
  onToggleSidebar: () => void
  onToggleActivity: () => void
}

export function TopBar({
  workspace,
  model,
  onModelChange,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onToggleActivity,
}: TopBarProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
        >
          <Menu className="size-4.5" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
            Workspace
          </span>
          <span className="hidden text-muted-foreground/50 sm:inline">/</span>
          <h1 className="truncate text-sm font-semibold text-foreground">{workspace}</h1>
          <span className="ml-1 hidden items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary sm:inline-flex">
            <span className="size-1.5 rounded-full bg-primary animate-pulse-ring" />
            Live
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Model selector */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-left transition-colors hover:border-primary/40"
          >
            <Cpu className="size-4 text-primary" />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-[11px] font-medium text-foreground">{model.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {model.provider} · {model.context}
              </span>
            </span>
            <span className="text-xs font-medium text-foreground sm:hidden">{model.provider}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-2xl">
              <p className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Inference model
              </p>
              {MODELS.map((m) => {
                const selected = m.id === model.id
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onModelChange(m)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      selected ? "bg-accent" : "hover:bg-accent/60",
                    )}
                  >
                    <Cpu
                      className={cn(
                        "size-4 shrink-0",
                        selected ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span className="flex flex-1 flex-col leading-tight">
                      <span className="text-[13px] font-medium text-foreground">{m.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {m.provider} · {m.context} ctx
                      </span>
                    </span>
                    {selected && <Check className="size-4 text-primary" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="grid size-9 place-items-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button
          onClick={onToggleActivity}
          aria-label="Toggle activity panel"
          className="grid size-9 place-items-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:text-foreground xl:hidden"
        >
          <PanelRightOpen className="size-4" />
        </button>
      </div>
    </header>
  )
}
