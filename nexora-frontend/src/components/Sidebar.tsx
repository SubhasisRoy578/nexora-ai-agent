// Define View type locally since '../App' doesn't exist
type View = 'chat' | 'dashboard' | 'knowledge' | 'settings' | 'analytics' | 'agents' | 'code'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡', badge: null, badgeActive: false },
  { id: 'chat', label: 'Chat', icon: '◈', badge: '3', badgeActive: true },
  { id: 'agents', label: 'Agents', icon: '◎', badge: '2', badgeActive: true },
  { id: 'knowledge', label: 'Knowledge', icon: '◻', badge: '12', badgeActive: false },
  { id: 'analytics', label: 'Analytics', icon: '◫', badge: null, badgeActive: false },
  { id: 'settings', label: 'Settings', icon: '⊙', badge: null, badgeActive: false },
]

const PROJECTS = [
  { name: 'Market Research', color: '#00d4ff' },
  { name: 'Code Refactor', color: '#a78bfa' },
  { name: 'Knowledge Base', color: '#00e5a0' },
  { name: 'Product Docs', color: '#f5a623' },
]

const CHATS = [
  { title: 'AI competitor analysis', tag: 'RAG', time: '2m ago', active: true },
  { title: 'Code review: auth module', tag: 'Code', time: '18m ago' },
  { title: 'Summarize Q3 reports', tag: 'Docs', time: '1h ago' },
  { title: 'Python async patterns', tag: 'Code', time: '3h ago' },
  { title: 'Research: LLM benchmarks', tag: 'Agent', time: 'Yesterday' },
  { title: 'Draft pitch deck copy', tag: 'Chat', time: 'Yesterday' },
]

type Props = {
  activeView: View
  setActiveView: (v: View) => void
  activeChat: string
  setActiveChat: (c: string) => void
  onCommandOpen: () => void
}

export default function Sidebar({ activeView, setActiveView, activeChat, setActiveChat, onCommandOpen }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">N</div>
        <div>
          <div className="sidebar-brand">Nexora</div>
        </div>
        <div style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--text-ghost)', fontSize: '18px' }} onClick={onCommandOpen} title="⌘K">⌘</div>
      </div>

      <div className="sidebar-nav">
        <button className="btn-new-chat" onClick={() => setActiveView('chat')}>
          <span style={{ fontSize: '14px' }}>+</span> New session
        </button>
        <div style={{ height: '8px' }} />
        {NAV.map(n => (
          <div key={n.id} className={`nav-item${activeView === n.id ? ' active' : ''}`} onClick={() => setActiveView(n.id as View)}>
            <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{n.icon}</span>
            <span>{n.label}</span>
            {n.badge && <span className={`nav-badge${n.badgeActive ? ' active-badge' : ''}`}>{n.badge}</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Projects</div>
        {PROJECTS.map(p => (
          <div key={p.name} className="project-item">
            <div className="project-dot" style={{ background: p.color }} />
            <span>{p.name}</span>
          </div>
        ))}

        <div className="sidebar-section-title" style={{ marginTop: '12px' }}>Recent chats</div>
        {CHATS.map(c => (
          <div key={c.title} className={`chat-item${activeChat === c.title ? ' active' : ''}`} onClick={() => { setActiveChat(c.title); setActiveView('chat') }}>
            <div className="chat-title">{c.title}</div>
            <div className="chat-meta">
              <span className="chat-tag">{c.tag}</span>
              <span className="chat-time">{c.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-row">
          <div className="user-avatar">S</div>
          <div>
            <div className="user-name">Samarjit</div>
            <div className="user-plan">PRO · claude-sonnet</div>
          </div>
        </div>
      </div>
    </div>
  )
}
