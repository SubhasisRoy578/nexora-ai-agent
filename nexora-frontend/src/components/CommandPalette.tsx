import { useState } from 'react'

// Define the View type locally since it's only used here
export type View = 'chat' | 'dashboard' | 'knowledge' | 'settings' | 'analytics' | 'agents' | 'code'

const COMMANDS = [
  { section: 'Navigate', items: [
    { label: 'Go to Dashboard', icon: '⬡', shortcut: 'G D', view: 'dashboard' as View },
    { label: 'Go to Chat', icon: '◈', shortcut: 'G C', view: 'chat' as View },
    { label: 'Go to Agents', icon: '◎', shortcut: 'G A', view: 'agents' as View },
    { label: 'Go to Knowledge Base', icon: '◻', shortcut: 'G K', view: 'knowledge' as View },
    { label: 'Go to Analytics', icon: '◫', shortcut: 'G N', view: 'analytics' as View },
    { label: 'Go to Settings', icon: '⊙', shortcut: 'G S', view: 'settings' as View },
  ]},
  { section: 'Actions', items: [
    { label: 'New Chat session', icon: '+', shortcut: '⌘ N', view: 'chat' as View },
    { label: 'Upload document', icon: '↑', shortcut: null, view: 'knowledge' as View },
    { label: 'Launch Research Agent', icon: '🔍', shortcut: null, view: 'agents' as View },
    { label: 'Deploy new agent', icon: '◎', shortcut: null, view: 'agents' as View },
  ]},
]

interface CommandPaletteProps {
  onClose: () => void
  onNavigate: (view: View) => void
}

export default function CommandPalette({ onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)

  const allItems = COMMANDS.flatMap(s => s.items)
  const filtered = query ? allItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase())) : allItems

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-box" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-row">
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>⌘</span>
          <input 
            className="cmd-input" 
            placeholder="Search commands, navigate, run agents..." 
            autoFocus 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') setSel(s => Math.min(s + 1, filtered.length - 1))
              if (e.key === 'ArrowUp') setSel(s => Math.max(s - 1, 0))
              if (e.key === 'Enter' && filtered[sel]) { onNavigate(filtered[sel].view) }
              if (e.key === 'Escape') onClose()
            }} 
          />
          <span style={{ 
            fontSize: '11px', 
            fontFamily: 'var(--font-mono)', 
            color: 'var(--text-ghost)', 
            background: 'var(--bg-base)', 
            padding: '2px 6px', 
            borderRadius: '3px', 
            border: '1px solid var(--border-dim)' 
          }}>ESC</span>
        </div>
        <div className="cmd-list">
          {query ? (
            filtered.map((item, i) => (
              <div 
                key={item.label} 
                className={`cmd-item${sel === i ? ' selected' : ''}`} 
                onClick={() => onNavigate(item.view)}
              >
                <div className="cmd-item-icon">{item.icon}</div>
                <span className="cmd-item-label">{item.label}</span>
                {item.shortcut && <span className="cmd-item-shortcut">{item.shortcut}</span>}
              </div>
            ))
          ) : (
            COMMANDS.map(section => (
              <div key={section.section}>
                <div className="cmd-section-label">{section.section}</div>
                {section.items.map(item => (
                  <div 
                    key={item.label} 
                    className="cmd-item" 
                    onClick={() => onNavigate(item.view)}
                  >
                    <div className="cmd-item-icon">{item.icon}</div>
                    <span className="cmd-item-label">{item.label}</span>
                    {item.shortcut && <span className="cmd-item-shortcut">{item.shortcut}</span>}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
        <div className="cmd-footer">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>ESC close</span>
        </div>
      </div>
    </div>
  )
}
