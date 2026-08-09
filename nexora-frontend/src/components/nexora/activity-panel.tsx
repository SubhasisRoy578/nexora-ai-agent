"use client"

import {
  Brain,
  Search,
  Wrench,
  Database,
  Code2,
  CheckCircle2,
  Info,
  X,
  Activity,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityKind, ActivityLog } from "@/lib/nexora-data"

const KIND_META: Record<ActivityKind, { icon: LucideIcon; color: string }> = {
  thinking: { icon: Brain, color: "text-chart-5" },
  search: { icon: Search, color: "text-chart-2" },
  tool: { icon: Wrench, color: "text-primary" },
  rag: { icon: Database, color: "text-chart-3" },
  code: { icon: Code2, color: "text-chart-4" },
  success: { icon: CheckCircle2, color: "text-chart-3" },
  info: { icon: Info, color: "text-muted-foreground" },
}

interface ActivityPanelProps {
  logs: ActivityLog[]
  busy: boolean
  model: string
  open: boolean
  onClose: () => void
}

export function ActivityPanel({ logs, busy, model, open, onClose }: ActivityPanelProps) {
  return (
    <>
      {open && (
        <button
          aria-label="Close activity panel"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm xl:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-[280px] flex-col border-l border-border bg-sidebar text-sidebar-foreground transition-transform duration-300 sm:w-[300px] xl:static xl:z-auto xl:w-[240px] xl:translate-x-0",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Agent Activity</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground xl:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Live status */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5">
            <span className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span
                  className={cn(
                    "absolute inline-flex size-full rounded-full",
                    busy ? "bg-chart-4 animate-pulse-ring" : "bg-chart-3 animate-pulse-ring",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex size-2.5 rounded-full",
                    busy ? "bg-chart-4" : "bg-chart-3",
                  )}
                />
              </span>
              <span className="text-xs font-medium text-foreground">
                {busy ? "Executing" : "Idle · Ready"}
              </span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {busy ? "Running" : "Online"}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Stat label="Model" value={model} />
            <Stat label="Latency" value={busy ? "—" : "1.8s"} />
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Execution log
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{logs.length}</span>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-4">
          <ol className="relative space-y-3 border-l border-border pl-4">
            {logs.map((log) => {
              const meta = KIND_META[log.kind]
              const Icon = meta.icon
              return (
                <li key={log.id} className="relative animate-log-in">
                  <span className="absolute -left-[22px] top-0.5 grid size-3.5 place-items-center rounded-full border border-border bg-sidebar">
                    <span className={cn("size-1.5 rounded-full bg-current", meta.color)} />
                  </span>
                  <div className="flex items-start gap-2">
                    <Icon className={cn("mt-0.5 size-3.5 shrink-0", meta.color)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium leading-tight text-foreground">
                        {log.label}
                      </p>
                      {log.detail && (
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                          {log.detail}
                        </p>
                      )}
                      {typeof log.progress === "number" && (
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${log.progress}%` }}
                          />
                        </div>
                      )}
                      <span className="mt-0.5 block font-mono text-[9px] text-muted-foreground/70">
                        {log.time}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
            {busy && (
              <li className="relative animate-log-in">
                <span className="absolute -left-[22px] top-0.5 grid size-3.5 place-items-center rounded-full border border-primary bg-sidebar">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                </span>
                <p className="text-[12px] font-medium text-primary">
                  Agent thinking
                  <span className="animate-blink">_</span>
                </p>
              </li>
            )}
          </ol>
        </div>
      </aside>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-2.5 py-1.5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-xs font-medium text-foreground">{value}</p>
    </div>
  )
}
