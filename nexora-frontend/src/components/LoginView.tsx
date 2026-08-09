import { useState } from 'react'

export default function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 900)
  }

  return (
    <div className="login-page">
      <div className="login-grid" />
      <div className="login-glow" />
      <div className="login-card">
        <div className="login-logo">N</div>
        <div className="login-title">Nexora AI</div>
        <div className="login-sub">Professional AI operating system</div>
        <div className="login-form">
          <div className="login-field">
            <label className="login-label">Email address</label>
            <input 
              className="nx-input" 
              type="email" 
              placeholder="you@company.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input 
              className="nx-input" 
              type="password" 
              placeholder="••••••••" 
              value={pass} 
              onChange={e => setPass(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleLogin()} 
            />
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: '4px' }} 
            onClick={handleLogin} 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
          <div className="login-divider">or continue with</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Google</button>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>GitHub</button>
          </div>
        </div>
        <div className="login-footer">
          Don't have an account? <span className="login-link">Request access</span>
        </div>
        <div style={{ marginTop: '20px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Demo access
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Click Sign in with any credentials
          </div>
        </div>
      </div>
    </div>
  )
}
