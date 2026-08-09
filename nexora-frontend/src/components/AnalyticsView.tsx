const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const REQUESTS = [42, 78, 65, 91, 134, 87, 103]
const TOKENS = [1.2, 2.1, 1.8, 2.6, 4.1, 2.4, 3.2]

const PERF = [
  { label: 'P50 Latency', value: '0.8s', trend: '↓', good: true },
  { label: 'P95 Latency', value: '2.4s', trend: '↓', good: true },
  { label: 'Error rate', value: '0.3%', trend: '↓', good: true },
  { label: 'Cache hit', value: '61%', trend: '↑', good: true },
]

export default function AnalyticsView() {
  const maxReq = Math.max(...REQUESTS)
  const maxTok = Math.max(...TOKENS)

  return (
    <div className="analytics-view">
      <div className="dash-header">
        <div className="dash-title">Analytics</div>
        <div className="dash-sub">Usage, performance, and cost insights</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {PERF.map(p => (
          <div key={p.label} className="metric-card">
            <div className="metric-label">{p.label}</div>
            <div className="metric-value" style={{ fontSize: '22px' }}>{p.value}</div>
            <div className="metric-sub" style={{ color: p.good ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>{p.trend} vs last week</div>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <div className="chart-title">Requests per day</div>
          <div className="bar-chart">
            {REQUESTS.map((v, i) => (
              <div key={i} className="bar-col">
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v}</div>
                <div className="bar-fill" style={{ height: `${(v / maxReq) * 90}px`, background: 'var(--accent-cyan)' }} />
                <div className="bar-lbl">{DAYS[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Tokens used (M)</div>
          <div className="bar-chart">
            {TOKENS.map((v, i) => (
              <div key={i} className="bar-col">
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v}M</div>
                <div className="bar-fill" style={{ height: `${(v / maxTok) * 90}px`, background: 'var(--accent-purple)' }} />
                <div className="bar-lbl">{DAYS[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-grid" style={{ marginTop: '12px' }}>
        <div className="chart-card">
          <div className="chart-title">Agent task distribution</div>
          {[
            { name: 'Research', pct: 38, color: 'var(--accent-emerald)' },
            { name: 'RAG', pct: 34, color: 'var(--accent-cyan)' },
            { name: 'Code', pct: 18, color: 'var(--accent-purple)' },
            { name: 'Browser', pct: 10, color: 'var(--accent-amber)' },
          ].map(a => (
            <div key={a.name} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{a.name}</span>
                <span style={{ color: a.color, fontFamily: 'var(--font-mono)' }}>{a.pct}%</span>
              </div>
              <div className="prog-bar" style={{ height: '4px' }}>
                <div className="prog-bar-fill" style={{ width: `${a.pct}%`, background: a.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="chart-card">
          <div className="chart-title">Cost breakdown</div>
          {[
            { label: 'Claude Sonnet 4-6', cost: '$18.40', pct: 52 },
            { label: 'Groq Llama', cost: '$6.80', pct: 19 },
            { label: 'Gemini Flash', cost: '$4.20', pct: 12 },
            { label: 'Embeddings', cost: '$5.80', pct: 17 },
          ].map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>{c.label}</span>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>{c.cost}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total this month</span>
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)' }}>$35.20</span>
          </div>
        </div>
      </div>
    </div>
  )
}
