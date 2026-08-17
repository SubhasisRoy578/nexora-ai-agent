'use client'
import { useEffect, useState } from 'react'
import { useAgentStore } from '@/store/agentStore'

export default function RightPanel() {
  const store = useAgentStore()
  const agents = store?.agents ?? []
  const tasks = store?.tasks ?? []
  // ✅ FIXED: notifications doesn't exist in AgentStore, using empty array
  const notifications: Array<{ id: string; text: string; type: string; time: string }> = []

  return (
    <aside
      style={{
        width: 'var(--right-panel-width, 210px)',
        background: 'var(--nx-surface)',
        borderLeft: '1px solid var(--nx-border)',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, overflow: 'hidden',
      }}
      aria-label="Agent activity"
    >
      {/* Header */}
      <div style={{
        padding: '9px 12px 8px',
        borderBottom: '1px solid var(--nx-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--nx-text-muted)',
        }}>Agent Activity</span>
        <LivePulse />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Agent cards */}
        {agents && agents.length > 0 ? (
          agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))
        ) : (
          <div style={{ padding: '12px', fontSize: 10, color: 'var(--nx-text-muted)' }}>No agents</div>
        )}

        {/* Running tasks */}
        {tasks && tasks.length > 0 && (
          <>
            <SectionDivider label="Running Tasks" />
            {tasks.map(task => (
              <div key={task.id} style={{
                padding: '7px 12px', borderBottom: '1px solid var(--nx-border)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--nx-text)', fontWeight: 500, marginBottom: 2 }}>
                  {task.task || 'Task'}  {/* ✅ FIXED: task.task instead of task.name */}
                </div>
                <div style={{ fontSize: 9, fontFamily: 'var(--nx-mono)', color: 'var(--nx-text-muted)' }}>
                  {task.status || 'Processing...'}  {/* ✅ FIXED: task.status instead of task.step */}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Notifications - temporarily removed since not in store */}
        {notifications && notifications.length > 0 && (
          <>
            <SectionDivider label="Notifications" />
            {notifications.map(n => (
              <div key={n.id} style={{
                padding: '7px 12px', display: 'flex', gap: 7,
                borderBottom: '1px solid var(--nx-border)',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, marginTop: 1,
                  background: n.type === 'success' ? 'rgba(16,185,129,0.14)' : 'rgba(59,130,246,0.14)',
                  color: n.type === 'success' ? 'var(--nx-green)' : 'var(--nx-accent)',
                }}>
                  {n.type === 'success' ? '✓' : '✨'}
                </div>
                <div>
                  <div style={{ fontSize: 10, lineHeight: 1.4, color: 'var(--nx-text-muted)' }}>
                    {n.text}
                  </div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--nx-mono)', color: 'rgba(100,116,139,0.55)', marginTop: 2 }}>
                    {n.time}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 12px',
        borderTop: '1px solid var(--nx-border)',
      }}>
        {[
          { val: agents?.filter((a: any) => a.status === 'running').length ?? 0, label: 'Active', color: 'var(--nx-green)' },
          { val: tasks?.length ?? 0, label: 'Tasks', color: 'var(--nx-text)' },
          { val: '98%', label: 'Uptime', color: 'var(--nx-accent)' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--nx-mono)', color: s.color }}>
              {s.val}
            </div>
            <div style={{ fontSize: 8, color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function AgentCard({ agent }: { agent: any }) {
  const [progress, setProgress] = useState(agent?.progress ?? 0)

  useEffect(() => {
    if (!agent || agent.status !== 'running') return
    const t = setInterval(() => {
      setProgress((p: number) => Math.min(p + Math.random() * 1.5, 99))
    }, 2500)
    return () => clearInterval(t)
  }, [agent, agent?.status])

  const statusStyle: Record<string, { bg: string; color: string; border: string }> = {
    running: { bg: 'rgba(16,185,129,0.10)', color: 'var(--nx-green)',  border: 'rgba(16,185,129,0.18)' },
    idle:    { bg: 'rgba(100,116,139,0.10)', color: 'var(--nx-text-muted)', border: 'rgba(100,116,139,0.14)' },
    queued:  { bg: 'rgba(245,158,11,0.10)', color: 'var(--nx-amber)', border: 'rgba(245,158,11,0.18)' },
  }
  const ss = statusStyle[agent?.status ?? 'idle'] ?? statusStyle.idle
  const barColor = agent?.status === 'running' ? 'var(--nx-green)' : agent?.status === 'queued' ? 'var(--nx-amber)' : 'var(--nx-text-muted)'

  return (
    <div style={{
      margin: 8, borderRadius: 8, padding: '9px 10px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--nx-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--nx-text)' }}>
          {agent?.name ?? 'Agent'}
        </span>
        <span style={{
          fontSize: 9, fontFamily: 'var(--nx-mono)', padding: '2px 6px', borderRadius: 3,
          background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
        }}>
          {agent?.status?.toUpperCase() ?? 'IDLE'}
        </span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
        <div style={{ height: '100%', borderRadius: 2, background: barColor, width: `${progress}%`, transition: 'width 1s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--nx-mono)', color: 'var(--nx-text-muted)' }}>
        <span>{agent?.step ?? 'Idle'}</span>
        <span>{agent?.status === 'running' ? `${Math.round(progress)}%` : '—'}</span>
      </div>
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ padding: '8px 12px 5px', borderTop: '1px solid var(--nx-border)', marginTop: 4 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--nx-text-muted)', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}

function LivePulse() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--nx-green)', fontFamily: 'var(--nx-mono)' }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: 'var(--nx-green)',
        animation: 'nx-pulse 1.5s infinite',
      }} />
      LIVE
    </div>
  )
}
