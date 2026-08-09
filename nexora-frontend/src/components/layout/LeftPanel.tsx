'use client'
import { useState } from 'react'
import { useChatStore } from '@/store/chatStore'

const PROJECTS = [
  { name: 'Market Research', color: '#3b82f6' },
  { name: 'Code Refactor',   color: '#8b5cf6' },
  { name: 'Knowledge Base',  color: '#10b981' },
  { name: 'Product Docs',    color: '#f59e0b' },
]

const TYPE_COLORS: Record<string, string> = {
  RAG:   '#22d3ee',
  Code:  '#a78bfa',
  Agent: '#10b981',
  Docs:  '#f59e0b',
  Chat:  '#64748b',
}

export default function LeftPanel() {
  const { messages } = useChatStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Build conversations from messages
  const conversations = messages
    .filter(m => m.type === 'user')
    .slice(-8)
    .reverse()
    .map((m, i) => ({
      id: `conv_${i}`,
      title: m.content.substring(0, 40) + (m.content.length > 40 ? '...' : ''),
      type: m.tools?.[0]?.toUpperCase() || 'Chat',
      time: '2m ago',
    })) || []

  return (
    <aside
      style={{
        width: 'var(--sidebar-panel-width, 188px)',
        background: 'var(--nx-surface)',
        borderRight: '1px solid var(--nx-border)',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, overflow: 'hidden',
      }}
      aria-label="Projects and chats"
    >
      {/* New chat */}
      <div style={{ padding: '10px 10px 6px' }}>
        <button
          style={{
            width: '100%', height: 30, borderRadius: 6,
            background: 'rgba(59,130,246,0.08)',
            border: '1px dashed rgba(59,130,246,0.28)',
            color: 'var(--nx-accent)', fontSize: 11,
            fontFamily: 'var(--nx-display)', fontWeight: 600,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.15s', marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>+</span>
          New Chat
        </button>

        {/* Projects */}
        <SectionLabel>Projects</SectionLabel>
        {PROJECTS.map(p => (
          <div
            key={p.name}
            style={{
              padding: '6px 8px', borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 7,
              cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--nx-text)' }}>{p.name}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--nx-border)', margin: '4px 10px' }} />

      {/* Recent chats */}
      <div style={{ padding: '8px 10px 4px' }}>
        <SectionLabel>Recent Chats</SectionLabel>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px' }}>
        {conversations && conversations.length > 0 ? (
          conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              style={{
                padding: '7px 8px', borderRadius: 6, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 2,
                transition: 'all 0.12s',
                background: conv.id === activeId ? 'rgba(59,130,246,0.10)' : 'transparent',
                borderLeft: conv.id === activeId ? '2px solid var(--nx-accent)' : '2px solid transparent',
              }}
              onMouseEnter={e => {
                if (conv.id !== activeId) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={e => {
                if (conv.id !== activeId) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--nx-text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{conv.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  fontSize: 9, padding: '1px 5px', borderRadius: 3,
                  background: 'rgba(255,255,255,0.05)',
                  color: TYPE_COLORS[conv.type] ?? '#64748b',
                  fontFamily: 'var(--nx-mono)',
                }}>{conv.type}</span>
                <span style={{ fontSize: 9, color: 'var(--nx-text-muted)', fontFamily: 'var(--nx-mono)' }}>
                  {conv.time}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 10, color: 'var(--nx-text-muted)', padding: '10px', textAlign: 'center' }}>
            No chats yet
          </div>
        )}
      </div>

      {/* Upload shortcut */}
      <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--nx-border)' }}>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--nx-text-muted)', fontSize: 11,
          fontFamily: 'var(--nx-display)',
          transition: 'color 0.12s',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--nx-text)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--nx-text-muted)')}
        >
          <span style={{ fontSize: 13 }}>↑</span>
          Upload to knowledge base
        </button>
      </div>
    </aside>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
      color: 'var(--nx-text-muted)', textTransform: 'uppercase',
      marginBottom: 5, padding: '0 2px',
    }}>
      {children}
    </div>
  )
}
