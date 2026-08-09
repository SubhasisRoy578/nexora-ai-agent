import { useEffect, useState } from 'react'

// Define View type locally (since import from '../App' was failing)
type View = 'chat' | 'dashboard' | 'knowledge' | 'settings' | 'analytics' | 'agents' | 'code'

// Local store implementations (since analyticsStore and dashboardStore are missing)
interface DashboardViewProps {
  setActiveView: (view: View) => void
}

// Mock metrics data
interface Metrics {
  avg_response: string
  success_rate: string
  tasks_today: number
  tokens_used: string
}

export default function DashboardView({ setActiveView }: DashboardViewProps) {
  // Local state instead of missing stores
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<any[]>([])

  // Fetch metrics on mount (mock implementation)
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      try {
        // Simulate API call - replace with actual API endpoint
        const mockMetrics: Metrics = {
          avg_response: '1.2s',
          success_rate: '98.5%',
          tasks_today: 147,
          tokens_used: '2.4M',
        }
        
        // Try to fetch from real API if available
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (apiUrl) {
          try {
            const response = await fetch(`${apiUrl}/analytics/metrics`)
            if (response.ok) {
              const data = await response.json()
              setMetrics(data)
              setLoading(false)
              return
            }
          } catch (e) {
            console.warn('Using mock metrics data')
          }
        }
        
        setMetrics(mockMetrics)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMetrics()
  }, [])

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (apiUrl) {
          const response = await fetch(`${apiUrl}/agents`)
          if (response.ok) {
            const data = await response.json()
            setAgents(data)
          }
        }
      } catch (error) {
        console.warn('Could not fetch agents')
      }
    }
    
    fetchAgents()
  }, [])

  const METRICS_MAP = [
    { key: 'avg_response', label: 'Avg Response' },
    { key: 'success_rate', label: 'Success Rate' },
    { key: 'tasks_today', label: 'Tasks Today' },
    { key: 'tokens_used', label: 'Tokens Used' },
  ]

  const PODS = [
    { name: 'Research Agent', status: 'running', detail: 'Crawling sources', pct: 73 },
    { name: 'RAG Agent', status: 'running', detail: 'Embedding docs', pct: 92 },
    { name: 'Code Agent', status: 'idle', detail: 'Awaiting task', pct: 0 },
    { name: 'Browser Agent', status: 'queued', detail: 'In queue · #2', pct: 0 },
  ]

  const TASKS = [
    { name: 'Competitor price scrape', agent: 'Research', step: 'Step 3/5 · Parsing results', status: 'running' },
    { name: 'Embed: market_2024.pdf', agent: 'RAG', step: 'Chunking · 847 / 923 tokens', status: 'running' },
    { name: 'Web scrape: G2 reviews', agent: 'Browser', step: 'Queued', status: 'queued' },
  ]

  const MODELS = [
    { name: 'Claude Sonnet', pct: 52, color: 'var(--accent-purple)', tokens: '2.4M' },
    { name: 'Groq Llama', pct: 28, color: 'var(--accent-cyan)', tokens: '1.3M' },
    { name: 'Gemini Flash', pct: 12, color: 'var(--accent-emerald)', tokens: '560K' },
    { name: 'GPT-4o mini', pct: 8, color: 'var(--accent-amber)', tokens: '370K' },
  ]

  return (
    <div className="dash-view" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div className="dash-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div className="dash-title" style={{ fontSize: '24px', fontWeight: 600 }}>Dashboard</div>
          <span className="badge badge-live" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
            background: 'rgba(239,68,68,0.15)', color: '#ef4444'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
            LIVE
          </span>
        </div>
        <div className="dash-sub" style={{ fontSize: '13px', color: 'var(--nx-text-muted)' }}>
          Agent fleet & analytics · {loading ? 'Loading...' : 'Updated now'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--nx-text-muted)' }}>
          <div style={{ marginBottom: '12px' }}>⟳</div>
          Loading metrics...
        </div>
      ) : metrics ? (
        <>
          {/* Metrics Row */}
          <div className="metrics-row" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
            marginBottom: '24px'
          }}>
            {METRICS_MAP.map((m) => (
              <div key={m.key} className="metric-card" style={{
                background: 'var(--nx-card)', border: '1px solid var(--nx-border)',
                borderRadius: '12px', padding: '16px'
              }}>
                <div className="metric-label" style={{ fontSize: '11px', color: 'var(--nx-text-muted)', marginBottom: '8px' }}>
                  {m.label}
                </div>
                <div className="metric-value" style={{ fontSize: '28px', fontWeight: 600 }}>
                  {metrics[m.key as keyof Metrics]}
                </div>
              </div>
            ))}
          </div>

          {/* Agent Pods Section */}
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="section-title" style={{ fontSize: '16px', fontWeight: 600 }}>Agent Pods</div>
            <button 
              className="btn btn-ghost" 
              style={{ fontSize: '11px', padding: '4px 10px', background: 'transparent', border: '1px solid var(--nx-border)', borderRadius: '6px', cursor: 'pointer' }} 
              onClick={() => setActiveView('agents')}
            >
              Manage agents →
            </button>
          </div>
          
          <div className="agent-pods" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {PODS.map((p) => (
              <div key={p.name} className="agent-pod" style={{
                background: 'var(--nx-card)', border: '1px solid var(--nx-border)',
                borderRadius: '12px', padding: '16px'
              }}>
                <div className="agent-pod-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="agent-pod-name" style={{ fontWeight: 600 }}>{p.name}</span>
                  <span className={`badge badge-${p.status}`} style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 600,
                    background: p.status === 'running' ? 'rgba(34,211,238,0.15)' : 'rgba(107,114,128,0.15)',
                    color: p.status === 'running' ? '#22d3ee' : '#9ca3af'
                  }}>{p.status.toUpperCase()}</span>
                </div>
                {p.pct > 0 ? (
                  <div className="prog-bar" style={{ marginBottom: '6px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div className="prog-bar-fill" style={{ width: `${p.pct}%`, height: '100%', background: '#22d3ee' }} />
                  </div>
                ) : (
                  <div style={{ height: '8px' }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--nx-text-muted)', fontFamily: 'monospace' }}>{p.detail}</span>
                  {p.pct > 0 && <span style={{ color: '#22d3ee', fontFamily: 'monospace' }}>{p.pct}%</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Task Feed */}
          <div className="task-feed" style={{ marginBottom: '32px' }}>
            <div className="task-feed-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="section-title" style={{ fontSize: '16px', fontWeight: 600 }}>Task Feed</span>
              <span style={{ fontSize: '10px', color: 'var(--nx-text-muted)', fontFamily: 'monospace' }}>
                3 tasks · 2 running
              </span>
            </div>
            <table className="task-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--nx-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 600 }}>Task</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 600 }}>Agent</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 600 }}>Step</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {TASKS.map((t) => (
                  <tr key={t.name} style={{ borderBottom: '1px solid var(--nx-border)' }}>
                    <td style={{ padding: '12px 8px', fontSize: '12px' }}>{t.name}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500,
                        background: t.agent === 'RAG' ? 'rgba(6,182,212,0.1)' : 'rgba(139,92,246,0.1)',
                        color: t.agent === 'RAG' ? '#22d3ee' : '#a78bfa'
                      }}>{t.agent}</span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '11px', fontFamily: 'monospace' }}>{t.step}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 600,
                        background: t.status === 'running' ? 'rgba(34,211,238,0.15)' : 'rgba(245,158,11,0.15)',
                        color: t.status === 'running' ? '#22d3ee' : '#f59e0b'
                      }}>{t.status.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Model Usage */}
          <div className="dash-bottom">
            <div className="model-usage-card" style={{
              background: 'var(--nx-card)', border: '1px solid var(--nx-border)',
              borderRadius: '12px', padding: '16px'
            }}>
              <div className="section-title" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Model Usage</div>
              {MODELS.map((m) => (
                <div key={m.name} className="model-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div className="model-row-name" style={{ width: '90px', fontSize: '12px' }}>{m.name}</div>
                  <div className="model-row-bar" style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="model-row-fill" style={{ width: `${m.pct}%`, height: '100%', background: m.color }} />
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--nx-text-muted)', width: '36px', textAlign: 'right' }}>
                    {m.tokens}
                  </div>
                  <div className="model-row-pct" style={{ width: '36px', fontSize: '11px', fontWeight: 600, color: m.color }}>{m.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--nx-text-muted)' }}>
          No data available
        </div>
      )}
    </div>
  )
}
