'use client'

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

const TOOLS = [
  { id: 'rag',    icon: 'ti-database',    label: 'RAG',    defaultOn: true },
  { id: 'web',    icon: 'ti-world',       label: 'Search', defaultOn: true },
  { id: 'code',   icon: 'ti-code',        label: 'Code',   defaultOn: false },
  { id: 'agent',  icon: 'ti-robot',       label: 'Agent',  defaultOn: false },
  { id: 'upload', icon: 'ti-file-upload', label: 'Upload', defaultOn: false },
]

interface ChatInputProps {
  onSend: (text: string, files: File[]) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [activeTools, setActiveTools] = useState<Set<string>>(
    new Set(TOOLS.filter(t => t.defaultOn).map(t => t.id))
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleTool(id: string) {
    if (id === 'upload') { 
      fileInputRef.current?.click()
      return 
    }
    setActiveTools(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
      toast.success(`${files.length} file(s) selected`)
    }
  }

  function handleSend() {
    if ((!value.trim() && selectedFiles.length === 0) || disabled) return
    onSend(value.trim(), selectedFiles)
    setValue('')
    setSelectedFiles([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  return (
    <div style={{
      padding: '12px 16px 14px',
      background: 'var(--nx-bg, #0A0C12)',
      borderTop: '1px solid var(--nx-border, #1E2433)',
    }}>
      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {selectedFiles.map((file, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 4, padding: '2px 8px',
              fontSize: 10, fontFamily: 'monospace',
            }}>
              📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
              <button 
                onClick={() => removeFile(idx)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tool chips */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
        {TOOLS.map(tool => {
          const on = activeTools.has(tool.id)
          return (
            <button
              key={tool.id}
              onClick={() => toggleTool(tool.id)}
              aria-pressed={on}
              style={{
                height: 22, padding: '0 8px', borderRadius: 4, cursor: 'pointer',
                background: on ? 'rgba(59,130,246,0.10)' : 'rgba(255,255,255,0.04)',
                border: on ? '1px solid rgba(59,130,246,0.28)' : '1px solid var(--nx-border, #1E2433)',
                color: on ? '#22d3ee' : 'var(--nx-text-muted, #6B7280)',
                fontSize: 10, fontFamily: 'monospace',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <i className={`ti ${tool.icon}`} style={{ fontSize: 10 }} />
              {tool.label}
            </button>
          )
        })}
      </div>

      {/* Input box */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        background: 'var(--nx-card, #11141C)',
        border: '1px solid var(--nx-border, #1E2433)',
        borderRadius: 10, padding: '8px 10px',
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); handleInput() }}
          onKeyDown={handleKeyDown}
          placeholder={selectedFiles.length ? "Ask a question about your document..." : "Ask anything, launch an agent, or upload a document…"}
          rows={1}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--nx-text, #E5E7EB)', fontSize: 12, resize: 'none', lineHeight: 1.55,
            maxHeight: 120, fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          disabled={(!value.trim() && selectedFiles.length === 0) || disabled}
          style={{
            width: 30, height: 30, borderRadius: 7, border: 'none',
            background: (value.trim() || selectedFiles.length) && !disabled ? '#22d3ee' : 'rgba(34,211,238,0.25)',
            color: '#000', cursor: (value.trim() || selectedFiles.length) && !disabled ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ↑
        </button>
      </div>

      <input 
        ref={fileInputRef} 
        type="file" 
        style={{ display: 'none' }} 
        accept=".pdf,.txt,.md,.docx,.csv,.html" 
        multiple 
        onChange={handleFileSelect} 
      />
    </div>
  )
}
