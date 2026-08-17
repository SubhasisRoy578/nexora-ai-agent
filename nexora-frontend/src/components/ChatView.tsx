import { useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { motion, AnimatePresence } from 'framer-motion'

const CHIPS = [
  { id: 'rag', label: 'RAG', cls: 'chip-rag' },
  { id: 'search', label: 'Search', cls: 'chip-search' },
  { id: 'code', label: 'Code', cls: '' },
  { id: 'agent', label: 'Agent', cls: 'chip-agent' },
  { id: 'upload', label: 'Upload', cls: '' },
]

export default function ChatView() {
  const { messages, loading, error, sendMessage, setError } = useChatStore()
  const [active, setActive] = useState<string[]>(['rag', 'search'])
  const [input, setInput] = useState('')

  const toggle = (id: string) =>
    setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  const handleSend = async () => {
    if (!input.trim()) return
    try {
      setError(null)
      await sendMessage(input, active)
      setInput('')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="chat-view">
      <div className="chat-ctx-bar">
        <span className="dot dot-cyan" />
        Research workspace · RAG + Web Search enabled
        <span style={{ marginLeft: 'auto', color: 'var(--accent-emerald)', fontSize: '10px' }}>
          ● SYSTEM NOMINAL
        </span>
      </div>

      <div className="chat-messages">
        <div className="chat-messages-inner">
          <AnimatePresence initial={false}>
            {messages.map((m) =>
              m.type === 'user' ? (
                <motion.div 
                  key={m.id} 
                  className="msg-user"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="msg-user-bubble">{m.content}</div>
                </motion.div>
              ) : (
                <motion.div 
                  key={m.id} 
                  className="msg-ai"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="msg-avatar">N</div>
                  <div className="msg-ai-body">
                    {m.tools && (
                      <div className="msg-ai-tags">
                        {m.tools.map((t) => (
                          <span key={t} className={`badge badge-${t.toLowerCase()}`}>
                            {t.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="msg-ai-content">{m.content}</div>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}
            >
              ✦ Thinking...
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--accent-red-dim)',
                color: 'var(--accent-red)',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                marginTop: '8px',
              }}
            >
              {error}
            </motion.div>
          )}
        </div>
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <div className="tool-chips">
            {CHIPS.map((c) => (
              <motion.div
                key={c.id}
                className={`tool-chip ${c.cls} ${active.includes(c.id) ? 'active' : ''}`}
                onClick={() => toggle(c.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {c.label}
              </motion.div>
            ))}
          </div>
          <div className="chat-input-box">
            <textarea
              className="chat-textarea"
              placeholder="Ask anything, launch an agent, or upload a document..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={loading}
            />
            <motion.div 
              className="chat-send-btn" 
              onClick={handleSend} 
              style={{ opacity: loading ? 0.5 : 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M13 1L1 7l5 1.5L7 13l6-12z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
          <div className="chat-hint">↑ Upload to knowledge base · ⌘↵ Run agent · ⌘K command palette</div>
        </div>
      </div>
    </div>
  )
}