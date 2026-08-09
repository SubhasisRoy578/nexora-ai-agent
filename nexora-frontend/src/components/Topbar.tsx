// Define View type locally instead of importing from missing '../App'
type View = 'chat' | 'dashboard' | 'knowledge' | 'settings' | 'analytics' | 'agents' | 'code'

import { useState } from 'react'

const VIEW_LABELS: Record<View, string> = {
  dashboard: 'Dashboard',
  chat: 'Chat',
  knowledge: 'Knowledge Base',
  settings: 'Settings',
  analytics: 'Analytics',
  agents: 'Agents',
  code: 'Code',
}

const MODELS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5', 'gpt-4o', 'gemini-flash']

interface TopBarProps {
  activeView: View
  rightPanelOpen: boolean
  setRightPanelOpen: (v: boolean) => void
  onCommandOpen: () => void
}

export default function TopBar({ activeView, rightPanelOpen, setRightPanelOpen, onCommandOpen }: TopBarProps) {
  const [modelOpen, setModelOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6')

  return (
    <div className="topbar">
      <div className="topbar-breadcrumb">
        <span className="topbar-sep">WORKSPACE</span>
        <span className="topbar-sep">/</span>
        <span className="topbar-crumb-active">{VIEW_LABELS[activeView]}</span>
        {activeView === 'chat' && (
          <>
            <span className="topbar-sep">/</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI competitor analysis</span>
          </>
        )}
      </div>
      {activeView === 'chat' && (
        <div className="topbar-status">
          <span className="dot dot-green" />
          MULTI-AGENT · 3 ACTIVE
        </div>
      )}
      <div className="topbar-right">
        <div className="topbar-cmd" onClick={onCommandOpen}>
          <span>⌘K</span>
          <span style={{ opacity: 0.5 }}>Command</span>
        </div>
        <div className="model-pill" style={{ position: 'relative' }} onClick={() => setModelOpen(!modelOpen)}>
          <span style={{ color: 'var(--accent-cyan)', fontSize: '10px' }}>◈</span>
          <span>{selectedModel}</span>
          <span style={{ opacity: 0.4 }}>▾</span>
          {modelOpen && (
            <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 100, minWidth: '180px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
              {MODELS.map(m => (
                <div key={m} style={{ padding: '8px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: m === selectedModel ? 'var(--accent-cyan)' : 'var(--text-secondary)', cursor: 'pointer', background: m === selectedModel ? 'var(--accent-cyan-dim)' : 'transparent' }}
                  onClick={(e) => { e.stopPropagation(); setSelectedModel(m); setModelOpen(false) }}>
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={`topbar-icon-btn${rightPanelOpen ? ' active-panel' : ''}`} onClick={() => setRightPanelOpen(!rightPanelOpen)} title="Toggle activity panel">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="10" y1="1" x2="10" y2="14" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </div>
        <div className="topbar-icon-btn" title="Notifications">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5a4 4 0 0 1 4 4v3l1 2H2.5l1-2v-3a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6 11.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
