import { useEffect, useState } from 'react'
import { useAgentStore, Agent } from '../store/agentStore'  // ← IMPORT REAL STORE

const AGENT_ICONS: Record<string, string> = {
  research: '🔍',
  rag: '◈',
  code: '⌥',
  browser: '◻',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  idle: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  running: { bg: 'rgba(34,211,238,0.15)', color: '#22d3ee' },
  queued: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  completed: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  failed: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
}

export default function AgentsView() {
  const { agents, tasks, loading, error, fetchAgents, dispatch, setError } = useAgentStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [runningTask, setRunningTask] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleRunTask = async (agentId: string, taskName: string) => {
    setRunningTask(agentId)
    try {
      await dispatch(agentId, taskName)  // ← NOW WORKS: dispatch expects 2 args
    } finally {
      setRunningTask(null)
    }
  }

  const formatSuccess = (success: string | number) => {
    if (typeof success === 'number') return `${success}%`
    return success
  }

  return (
    <div className="agents-view" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div className="dash-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="dash-title" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
              Agents
            </div>
            <div className="dash-sub" style={{ fontSize: '13px', color: 'var(--nx-text-muted)' }}>
              Configure, monitor, and deploy autonomous AI agents
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{
              padding: '8px 16px',
              background: 'var(--accent-cyan)',
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + Deploy new agent
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239,68,68,0.1)', 
          color: '#ef4444', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '16px', 
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ {error}</span>
          <button 
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {loading && agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--nx-text-muted)' }}>
          <div style={{ marginBottom: '12px' }}>⟳</div>
          Loading agents...
        </div>
      ) : (
        <>
          <div className="agents-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {agents.map((agent: Agent) => (
              <div
                key={agent.id}
                className={`agent-card${selected === agent.id ? ' active' : ''}`}
                style={{
                  background: 'var(--nx-card)',
                  border: selected === agent.id ? '1px solid var(--accent-cyan)' : '1px solid var(--nx-border)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setSelected(selected === agent.id ? null : agent.id)}
              >
                <div className="agent-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div
                    className="agent-icon"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'rgba(34,211,238,0.1)',
                      color: '#22d3ee',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    {agent.icon || AGENT_ICONS[agent.id] || '◉'}
                  </div>
                  <span className={`badge badge-${agent.status}`} style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    background: STATUS_COLORS[agent.status]?.bg || 'rgba(107,114,128,0.15)',
                    color: STATUS_COLORS[agent.status]?.color || '#9ca3af',
                  }}>
                    {agent.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="agent-card-name" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  {agent.name}
                </div>
                
                <div className="agent-card-stats" style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                  <div className="agent-stat">
                    <div className="agent-stat-val" style={{ fontSize: '20px', fontWeight: 600 }}>{agent.tasks}</div>
                    <div className="agent-stat-lbl" style={{ fontSize: '10px', color: 'var(--nx-text-muted)' }}>Tasks run</div>
                  </div>
                  <div className="agent-stat">
                    <div className="agent-stat-val" style={{ fontSize: '20px', fontWeight: 600, color: '#22d3ee' }}>
                      {formatSuccess(agent.success)}
                    </div>
                    <div className="agent-stat-lbl" style={{ fontSize: '10px', color: 'var(--nx-text-muted)' }}>Success</div>
                  </div>
                </div>
                
                {selected === agent.id && (
                  <div style={{ 
                    marginTop: '16px', 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--nx-border)', 
                    display: 'flex', 
                    gap: '8px' 
                  }}>
                    <button 
                      className="btn btn-ghost" 
                      style={{ 
                        fontSize: '11px', 
                        flex: 1, 
                        padding: '8px',
                        background: 'transparent',
                        border: '1px solid var(--nx-border)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Configure
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleRunTask(agent.id, 'Run task')}
                      disabled={runningTask === agent.id}
                      style={{ 
                        fontSize: '11px', 
                        flex: 1, 
                        padding: '8px',
                        background: '#22d3ee',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: runningTask === agent.id ? 'not-allowed' : 'pointer',
                        opacity: runningTask === agent.id ? 0.6 : 1
                      }}
                    >
                      {runningTask === agent.id ? '⟳ Running...' : 'Run task'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="task-feed">
            <div className="task-feed-header" style={{ marginBottom: '16px' }}>
              <span className="section-title" style={{ fontSize: '16px', fontWeight: 600 }}>Agent Run History</span>
            </div>
            
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--nx-text-muted)', border: '1px solid var(--nx-border)', borderRadius: '8px' }}>
                No tasks executed yet
              </div>
            ) : (
              <table className="task-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--nx-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--nx-text-muted)' }}>Task</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--nx-text-muted)' }}>Agent</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--nx-text-muted)' }}>Duration</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--nx-text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 10).map((task) => (
                    <tr key={task.id} style={{ borderBottom: '1px solid var(--nx-border)' }}>
                      <td className="task-name-cell" style={{ padding: '12px 8px', fontSize: '12px' }}>{task.task}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 500,
                          background: task.agent_id === 'rag' ? 'rgba(6,182,212,0.1)' : 'rgba(139,92,246,0.1)',
                          color: task.agent_id === 'rag' ? '#22d3ee' : '#a78bfa',
                        }}>
                          {task.agent_id.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '11px', fontFamily: 'monospace' }}>{task.duration || '—'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: STATUS_COLORS[task.status]?.bg || 'rgba(107,114,128,0.15)',
                          color: STATUS_COLORS[task.status]?.color || '#9ca3af',
                        }}>
                          {task.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
