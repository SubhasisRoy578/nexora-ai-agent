import { useEffect, useState } from 'react'

// Local types instead of missing dashboardStore
interface Agent {
  id: string
  label: string
  status: 'idle' | 'running' | 'queued' | 'completed' | 'failed'
  currentTask?: string
}

interface Task {
  id: string
  title: string
  status: 'running' | 'completed' | 'failed'
  durationMs?: number
}

// Mock WebSocket connection (replace with your actual API)
const connectAgentSocket = (
  onMessage: (data: any) => void,
  onError: (err: Event) => void
): WebSocket => {
  // For demo purposes - create a mock WebSocket that sends periodic updates
  const mockWs = {
    close: () => console.log('WebSocket closed'),
  } as WebSocket
  
  // Simulate real-time updates every 5 seconds
  const interval = setInterval(() => {
    onMessage({
      agent: ['Research', 'RAG', 'Code', 'Browser'][Math.floor(Math.random() * 4)],
      status: ['running', 'running', 'idle', 'queued'][Math.floor(Math.random() * 4)],
      pct: Math.floor(Math.random() * 100),
      step: 'Processing...',
    })
  }, 5000)
  
  // @ts-ignore - mock cleanup
  mockWs.close = () => clearInterval(interval)
  
  return mockWs
}

export default function RightPanel() {
  // Local state instead of useDashboardStore
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'research', label: 'Research Agent', status: 'running', currentTask: 'Crawling sources' },
    { id: 'rag', label: 'RAG Agent', status: 'running', currentTask: 'Embedding documents' },
    { id: 'code', label: 'Code Agent', status: 'idle', currentTask: 'Awaiting task' },
    { id: 'browser', label: 'Browser Agent', status: 'queued', currentTask: 'In queue' },
  ])
  
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Competitor price scrape', status: 'running', durationMs: 4200 },
    { id: '2', title: 'Embed market_2024.pdf', status: 'running', durationMs: 52000 },
    { id: '3', title: 'Code review', status: 'completed', durationMs: 68000 },
  ])
  
  const [ws, setWs] = useState<WebSocket | null>(null)

  // Update agent status function (replaces setAgentStatus from store)
  const updateAgentStatus = (agentName: string, status: string, step: string) => {
    setAgents(prev => prev.map(agent => 
      agent.label === agentName 
        ? { ...agent, status: status as Agent['status'], currentTask: step }
        : agent
    ))
  }

  useEffect(() => {
    const socket = connectAgentSocket(
      (data) => {
        // data = { agent: 'Research', status: 'running', pct: 74, step: '...' }
        updateAgentStatus(data.agent, data.status, data.step)
      },
      (err) => console.error('Socket error:', err)
    )
    setWs(socket)
    return () => socket?.close()
  }, [])

  const runningAgents = agents.filter((a) => a.status === 'running')
  const runningTasks = tasks.filter((t) => t.status === 'running').slice(0, 3)
  
  const notifs = [
    { text: 'Knowledge base updated — 3 new docs indexed', time: '2m ago', color: 'var(--accent-emerald, #10b981)' },
    { text: 'Research agent found 12 relevant sources', time: '4m ago', color: 'var(--accent-cyan, #22d3ee)' },
    { text: 'Code review completed — 2 suggestions', time: '8m ago', color: 'var(--accent-purple, #8b5cf6)' },
  ]

  return (
    <div className="right-panel" style={{
      width: '320px',
      background: 'var(--nx-bg, #0A0C12)',
      borderLeft: '1px solid var(--nx-border, #1E2433)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div className="rp-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid var(--nx-border, #1E2433)',
      }}>
        <span className="rp-title" style={{ fontWeight: 600, fontSize: '14px' }}>Agent Activity</span>
        <span className="badge badge-live rp-live" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 600,
          background: 'rgba(239,68,68,0.15)', color: '#ef4444'
        }}>
          <span className="dot dot-red" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
          LIVE
        </span>
      </div>

      <div className="rp-body" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {/* Running Agents */}
        <div className="section-label" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--nx-text-muted, #6B7280)', marginBottom: '8px' }}>
          Running agents ({runningAgents.length})
        </div>
        {runningAgents.length > 0 ? (
          runningAgents.map((a) => (
            <div key={a.id} className="agent-row" style={{
              background: 'var(--nx-card, #11141C)',
              border: '1px solid var(--nx-border, #1E2433)',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '8px',
            }}>
              <div className="agent-row-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="agent-name" style={{ fontSize: '12px', fontWeight: 500 }}>{a.label}</span>
                <span className={`badge badge-${a.status}`} style={{
                  padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: 600,
                  background: a.status === 'running' ? 'rgba(34,211,238,0.15)' : 'rgba(107,114,128,0.15)',
                  color: a.status === 'running' ? '#22d3ee' : '#9ca3af',
                }}>{a.status.toUpperCase()}</span>
              </div>
              <div className="agent-detail">
                <span style={{ fontSize: '10px', color: 'var(--nx-text-muted, #6B7280)' }}>{a.currentTask || 'Processing...'}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--nx-text-muted, #6B7280)', padding: '8px 0' }}>No running agents</div>
        )}

        {/* Running Tasks */}
        <div className="section-label" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--nx-text-muted, #6B7280)', marginTop: '16px', marginBottom: '8px' }}>
          Running tasks ({runningTasks.length})
        </div>
        <div className="nx-card" style={{ background: 'var(--nx-card, #11141C)', border: '1px solid var(--nx-border, #1E2433)', borderRadius: '8px', padding: '8px 12px' }}>
          {runningTasks.length > 0 ? (
            runningTasks.map((t) => (
              <div key={t.id} className="task-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--nx-border, #1E2433)' }}>
                <div className="task-name" style={{ fontSize: '11px' }}>{t.title}</div>
                <div className="task-step" style={{ fontSize: '9px', color: 'var(--nx-text-muted, #6B7280)', fontFamily: 'monospace' }}>
                  {t.durationMs ? `${t.durationMs}ms` : 'Running...'}
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '10px', color: 'var(--nx-text-muted, #6B7280)' }}>No running tasks</div>
          )}
        </div>

        {/* Notifications */}
        <div className="section-label" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--nx-text-muted, #6B7280)', marginTop: '16px', marginBottom: '8px' }}>
          Notifications
        </div>
        <div className="nx-card" style={{ background: 'var(--nx-card, #11141C)', border: '1px solid var(--nx-border, #1E2433)', borderRadius: '8px', padding: '8px 12px' }}>
          {notifs.map((n, i) => (
            <div key={i} className="notif-item" style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < notifs.length - 1 ? '1px solid var(--nx-border, #1E2433)' : 'none' }}>
              <div className="notif-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '2px', background: n.color, boxShadow: `0 0 5px ${n.color}` }} />
              <div style={{ flex: 1 }}>
                <div className="notif-text" style={{ fontSize: '11px', marginBottom: '2px' }}>{n.text}</div>
                <div className="notif-time" style={{ fontSize: '9px', color: 'var(--nx-text-muted, #6B7280)' }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="rp-stats" style={{
        display: 'flex',
        borderTop: '1px solid var(--nx-border, #1E2433)',
        padding: '12px 16px',
        gap: '16px',
      }}>
        <div className="rp-stat" style={{ flex: 1, textAlign: 'center' }}>
          <div className="rp-stat-val" style={{ fontSize: '20px', fontWeight: 600 }}>{runningAgents.length}</div>
          <div className="rp-stat-lbl" style={{ fontSize: '9px', color: 'var(--nx-text-muted, #6B7280)' }}>Active</div>
        </div>
        <div className="rp-stat" style={{ flex: 1, textAlign: 'center' }}>
          <div className="rp-stat-val" style={{ fontSize: '20px', fontWeight: 600 }}>{runningTasks.length}</div>
          <div className="rp-stat-lbl" style={{ fontSize: '9px', color: 'var(--nx-text-muted, #6B7280)' }}>Tasks</div>
        </div>
        <div className="rp-stat" style={{ flex: 1, textAlign: 'center' }}>
          <div className="rp-stat-val cyan" style={{ fontSize: '20px', fontWeight: 600, color: '#22d3ee' }}>98%</div>
          <div className="rp-stat-lbl" style={{ fontSize: '9px', color: 'var(--nx-text-muted, #6B7280)' }}>Uptime</div>
        </div>
      </div>
    </div>
  )
}
