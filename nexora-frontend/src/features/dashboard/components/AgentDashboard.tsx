'use client'
import { useEffect, useState } from 'react'
import { useAgentStore } from '@/store/agentStore'

// Only Groq - since that's your only working LLM
const MODEL_USAGE = [
  { name: 'Groq Llama', pct: 100, color: '#06b6d4', tokens: '4.6M' },
]

const PERF_STATS = [
  { label: 'Avg Response', val: '1.4s',  icon: 'ti-clock' },
  { label: 'Success Rate', val: '97.8%', icon: 'ti-check' },
  { label: 'Tasks Today',  val: '143',   icon: 'ti-list-check' },
  { label: 'Tokens Used',  val: '4.6M',  icon: 'ti-bolt' },
]

export default function AgentDashboard() {
  const { agents, tasks } = useAgentStore()
  // ✅ Use 0 as default progress since Agent type doesn't have progress
  const [progresses, setProgresses] = useState<Record<string, number>>(
    Object.fromEntries(agents.map(a => [a.id, 0]))
  )

  useEffect(() => {
    const t = setInterval(() => {
      setProgresses(prev => {
        const next = { ...prev }
        agents.forEach(a => {
          if (a.status === 'running' && next[a.id] < 99) {
            next[a.id] = Math.min(next[a.id] + Math.random() * 1.2, 99)
          }
        })
        return next
      })
    }, 2500)
    return () => clearInterval(t)
  }, [agents])

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '20px 24px',
      background: 'var(--nx-bg)', display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* Perf stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {PERF_STATS.map(s => (
          <div key={s.label} style={{
            background: 'var(--nx-card)', border: '1px solid var(--nx-border)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 14, color: 'var(--nx-accent)' }} aria-hidden="true" />
              <span style={{ fontSize: 10, color: 'var(--nx-text-muted)', fontFamily: 'var(--nx-mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--nx-mono)', color: 'var(--nx-text)', letterSpacing: '-0.02em' }}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: agents + model usage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Agent pods */}
        <div>
          <SectionHeader icon="ti-robot" label="Agent Pods" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 10 }}>
            {agents.map(agent => (
              <AgentPod key={agent.id} agent={agent} progress={progresses[agent.id] ?? 0} />
            ))}
          </div>
        </div>

        {/* Model usage - Only Groq */}
        <div>
          <SectionHeader icon="ti-chart-bar" label="Model Usage" />
          <div style={{
            marginTop: 10, background: 'var(--nx-card)',
            border: '1px solid var(--nx-border)', borderRadius: 10, padding: '16px',
          }}>
            {MODEL_USAGE.map(m => (
              <div key={m.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--nx-text)', fontWeight: 500 }}>{m.name}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--nx-text-muted)', fontFamily: 'var(--nx-mono)' }}>{m.tokens}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--nx-mono)', color: m.color, fontWeight: 700 }}>{m.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.pct}%`, background: m.color, borderRadius: 2, transition: 'width 1s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task feed */}
      <div>
        <SectionHeader icon="ti-list-check" label="Task Feed" />
        <div style={{
          marginTop: 10, background: 'var(--nx-card)',
          border: '1px solid var(--nx-border)', borderRadius: 10, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--nx-border)' }}>
                {['Task', 'Agent', 'Step', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '8px 14px', textAlign: 'left',
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                    color: 'var(--nx-text-muted)', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...tasks,
                { id: 't3', name: 'Web scrape: G2 reviews',    step: 'Queued',         agent: 'Browser',  status: 'queued' },
                { id: 't4', name: 'RAG: ingest 5 new PDFs',    step: 'Pending',        agent: 'RAG',      status: 'idle' },
                { id: 't5', name: 'Summarize Slack thread',    step: 'Done',           agent: 'Research', status: 'done' },
              ].map((task: any, i) => (
                <tr key={task.id} style={{ borderBottom: i < 4 ? '1px solid var(--nx-border)' : 'none' }}>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--nx-text)' }}>{task.name}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 4,
                      background: 'rgba(59,130,246,0.09)',
                      border: '1px solid rgba(59,130,246,0.18)',
                      color: 'var(--nx-accent)', fontFamily: 'var(--nx-mono)',
                    }}>{task.agent ?? (i === 0 ? 'Research' : 'RAG')}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--nx-text-muted)', fontFamily: 'var(--nx-mono)' }}>
                    {task.step}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge status={task.status ?? 'running'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AgentPod({ agent, progress }: { agent: any; progress: number }) {
  const colors = {
    running: { glow: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)', bar: 'var(--nx-green)' },
    idle:    { glow: 'transparent',           border: 'var(--nx-border)',      bar: 'var(--nx-text-muted)' },
    queued:  { glow: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.20)', bar: 'var(--nx-amber)' },
    error:   { glow: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.20)',  bar: 'var(--nx-red)' },
  }
  const c = colors[agent.status] ?? colors.idle

  return (
    <div style={{
      background: c.glow || 'var(--nx-card)',
      border: `1px solid ${c.border}`,
      borderRadius: 10, padding: '14px 16px',
      backgroundColor: 'var(--nx-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: `${c.bar}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`ti ${agent.icon}`} style={{ fontSize: 15, color: c.bar }} aria-hidden="true" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)' }}>{agent.name} Agent</span>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${agent.status !== 'idle' ? progress : 0}%`, background: c.bar, borderRadius: 2, transition: 'width 1.2s' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--nx-mono)', color: 'var(--nx-text-muted)' }}>
        <span>{agent.step}</span>
        <span>{agent.status === 'running' ? `${Math.round(progress)}%` : '—'}</span>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    running: { bg: 'rgba(16,185,129,0.10)', color: 'var(--nx-green)', border: 'rgba(16,185,129,0.20)' },
    idle:    { bg: 'rgba(100,116,139,0.10)', color: 'var(--nx-text-muted)', border: 'rgba(100,116,139,0.15)' },
    queued:  { bg: 'rgba(245,158,11,0.10)', color: 'var(--nx-amber)', border: 'rgba(245,158,11,0.18)' },
    done:    { bg: 'rgba(59,130,246,0.10)', color: 'var(--nx-accent)', border: 'rgba(59,130,246,0.20)' },
    error:   { bg: 'rgba(239,68,68,0.10)', color: 'var(--nx-red)', border: 'rgba(239,68,68,0.20)' },
  }
  const s = map[status] ?? map.idle
  return (
    <span style={{
      fontSize: 9, fontFamily: 'var(--nx-mono)', padding: '2px 7px', borderRadius: 3,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'uppercase',
    }}>{status}</span>
  )
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 15, color: 'var(--nx-accent)' }} aria-hidden="true" />
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text)', letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  )
}
