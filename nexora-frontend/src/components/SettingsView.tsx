import { useState } from 'react'

export default function SettingsView() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    rag: true, search: true, memory: false, telemetry: true, streaming: true, notifications: true,
  })
  const toggle = (k: string) => setToggles(t => ({ ...t, [k]: !t[k] }))
  const [theme, setTheme] = useState('void')

  const THEMES = [
    { id: 'void', label: 'Void', color: '#07080a' },
    { id: 'slate', label: 'Slate', color: '#0f1923' },
    { id: 'forest', label: 'Forest', color: '#0a1a10' },
    { id: 'midnight', label: 'Midnight', color: '#0d0a1e' },
  ]

  return (
    <div className="settings-view">
      <div className="dash-header">
        <div className="dash-title">Settings</div>
        <div className="dash-sub">Preferences, API keys, and system configuration</div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Appearance</div>
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Theme</div>
            <div className="setting-desc">Select your preferred color scheme</div>
          </div>
          <div className="theme-swatches">
            {THEMES.map(t => (
              <div key={t.id} className={`theme-swatch${theme === t.id ? ' active' : ''}`}
                style={{ background: t.color, border: theme === t.id ? '2px solid var(--accent-cyan)' : '2px solid var(--border-dim)' }}
                onClick={() => setTheme(t.id)}
                title={t.label} />
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">API Keys</div>
        {[
          { label: 'Anthropic API Key', placeholder: 'sk-ant-...' },
          { label: 'OpenAI API Key', placeholder: 'sk-...' },
          { label: 'Groq API Key', placeholder: 'gsk_...' },
          { label: 'Gemini API Key', placeholder: 'AIza...' },
        ].map(k => (
          <div key={k.label} className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <div className="setting-name">{k.label}</div>
            <div className="api-key-row" style={{ width: '100%' }}>
              <input className="nx-input" type="password" placeholder={k.placeholder} style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12px' }} />
              <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>Save</button>
              <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>Test</button>
            </div>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Features</div>
        {[
          { key: 'rag', name: 'RAG mode', desc: 'Enable retrieval-augmented generation from knowledge base' },
          { key: 'search', name: 'Web search', desc: 'Allow agents to search the web for current information' },
          { key: 'memory', name: 'Persistent memory', desc: 'Store and recall context across sessions' },
          { key: 'streaming', name: 'Streaming responses', desc: 'Display tokens as they are generated' },
          { key: 'notifications', name: 'Agent notifications', desc: 'Get notified when agent tasks complete' },
          { key: 'telemetry', name: 'Usage analytics', desc: 'Share anonymous usage data to improve Nexora' },
        ].map(s => (
          <div key={s.key} className="setting-row">
            <div className="setting-info">
              <div className="setting-name">{s.name}</div>
              <div className="setting-desc">{s.desc}</div>
            </div>
            <div className={`toggle${toggles[s.key] ? ' on' : ''}`} onClick={() => toggle(s.key)} />
          </div>
        ))}
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Default Model</div>
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Primary model</div>
            <div className="setting-desc">Used for all chat and agent tasks unless overridden</div>
          </div>
          <select className="nx-input" style={{ width: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <option>claude-sonnet-4-6</option>
            <option>claude-opus-4-6</option>
            <option>claude-haiku-4-5</option>
            <option>gpt-4o</option>
            <option>gemini-flash</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button className="btn btn-primary">Save changes</button>
        <button className="btn btn-ghost">Reset to defaults</button>
      </div>
    </div>
  )
}
