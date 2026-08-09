"use client"

import { MessageSquarePlus, Search, MessagesSquare, Settings, X } from "lucide-react"
import { NexoraLogo } from "./logo"
import { cn } from "@/lib/utils"
import type { ChatSession } from "@/lib/nexora-data"

interface SidebarProps {
  sessions: ChatSession[]
  activeId: string
  onSelect: (id: string) => void
  onNewChat: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  sessions,
  activeId,
  onSelect,
  onNewChat,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <NexoraLogo />
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 glow-ring"
          >
            <MessageSquarePlus className="size-4" />
            New Chat
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sessions"
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Sessions
          </span>
          <span className="rounded bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {sessions.length}
          </span>
        </div>

        <nav className="scrollbar-thin mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {sessions.map((session) => {
            const active = session.id === activeId
            return (
              <button
                key={session.id}
                onClick={() => onSelect(session.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary/40 bg-sidebar-accent"
                    : "border-transparent hover:border-border hover:bg-sidebar-accent/60",
                )}
              >
                <span className="flex items-center gap-2">
                  <MessagesSquare
                    className={cn(
                      "size-3.5 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="truncate text-[13px] font-medium text-foreground">
                    {session.title}
                  </span>
                </span>
                <span className="truncate pl-[22px] text-[11px] text-muted-foreground">
                  {session.preview}
                </span>
                <span className="pl-[22px] font-mono text-[10px] text-muted-foreground/70">
                  {session.updatedAt}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent">
            <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              NX
            </span>
            <span className="flex flex-1 flex-col leading-tight">
              <span className="text-[13px] font-medium text-foreground">Nexora Ops</span>
              <span className="text-[11px] text-muted-foreground">Pro workspace</span>
            </span>
            <Settings className="size-4 text-muted-foreground" />
          </button>
        </div>
      </aside>
    </>
  )
}
