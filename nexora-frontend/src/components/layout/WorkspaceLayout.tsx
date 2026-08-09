'use client'
import { useRouter, usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { MessageSquare, Bot, FileText, Database, Code, LineChart, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  rightPanel?: React.ReactNode
  leftPanel?: React.ReactNode
  topbarExtras?: React.ReactNode
  title?: string
  tag?: string
}

const NAV_ITEMS = [
  { icon: MessageSquare, label: 'Chat',        href: '/chat' },
  { icon: Bot,           label: 'Agents',      href: '/dashboard', badge: true },
  { icon: FileText,      label: 'Documents',   href: '/documents' },
  { icon: Database,      label: 'Knowledge',   href: '/knowledge' },
  { icon: Code,          label: 'Code',        href: '/code' },
  { icon: LineChart,     label: 'Analytics',   href: '/analytics' },
]

export default function WorkspaceLayout({
  children, rightPanel, leftPanel, topbarExtras, title = 'Workspace', tag,
}: WorkspaceLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
      {/* ── Icon Sidebar ── */}
      <nav
        className="flex w-[56px] shrink-0 flex-col items-center border-r border-border bg-sidebar py-3 z-50"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className="mb-2.5 flex size-8 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-extrabold tracking-tighter text-white"
          onClick={() => router.push('/chat')}
          title="Nexora"
        >
          N
        </div>

        <div className="flex flex-col gap-1.5 w-full items-center">
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <NavButton
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
              badge={item.badge}
              onClick={() => router.push(item.href)}
            />
          ))}
        </div>

        <div className="my-1 h-px w-7 bg-border" />

        <div className="flex flex-col gap-1.5 w-full items-center">
          {NAV_ITEMS.slice(4).map((item) => (
            <NavButton
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
              onClick={() => router.push(item.href)}
            />
          ))}
        </div>

        <div className="my-1 h-px w-7 bg-border" />

        <NavButton icon={Settings} label="Settings" onClick={() => router.push('/settings')} />

        {/* User avatar */}
        <div className="mt-auto">
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: 30, height: 30, borderRadius: '50%' },
              },
            }}
          />
        </div>
      </nav>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-border bg-sidebar px-3.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </span>
          {tag && (
            <span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.04em] text-blue-400 border border-blue-500/20">
              {tag}
            </span>
          )}
          {topbarExtras}
        </div>

        {/* Content row */}
        <div className="flex min-h-0 flex-1">
          {leftPanel}
          {children}
          {rightPanel}
        </div>
      </div>
    </div>
  )
}

function NavButton({
  icon: Icon, label, active = false, badge = false, onClick,
}: {
  icon: any; label: string; href?: string; active?: boolean; badge?: boolean; onClick?: () => void
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "group relative flex size-9 items-center justify-center rounded-lg transition-all duration-150",
        active 
          ? "bg-primary/15 text-primary" 
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      <Icon className="size-[18px]" strokeWidth={2} />
      {badge && (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-emerald-500 border-[1.5px] border-sidebar" />
      )}
    </button>
  )
}