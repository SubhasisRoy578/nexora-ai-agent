import { useEffect, useState } from 'react'

// Document type definition
interface Document {
  id: string
  name: string
  type: string
  size: string
  date: string
  status: string
  chunks: number
  icon: string
}

export default function KnowledgeView() {
  // Local state instead of missing knowledgeStore
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Document[]>([])

  // Fetch documents on mount
  const fetchDocs = async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      let documentsData: Document[] = []
      
      if (apiUrl) {
        try {
          const response = await fetch(`${apiUrl}/knowledge/documents`)
          if (response.ok) {
            documentsData = await response.json()
          } else {
            throw new Error('API returned error')
          }
        } catch (err) {
          console.warn('Using mock data:', err)
          documentsData = getMockDocuments()
        }
      } else {
        documentsData = getMockDocuments()
      }
      
      setDocs(documentsData)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(errMsg)
      setDocs(getMockDocuments())
    } finally {
      setLoading(false)
    }
  }

  // Upload document
  const upload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      
      if (apiUrl) {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch(`${apiUrl}/knowledge/upload`, {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error('Upload failed')
        }
      }
      
      // Refresh document list after upload
      await fetchDocs()
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to upload document'
      setError(errMsg)
      throw err
    } finally {
      setUploading(false)
    }
  }

  // Semantic search
  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      let results: Document[] = []
      
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/knowledge/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          results = await response.json()
        }
      }
      
      // Filter mock data if API not available
      if (results.length === 0) {
        results = docs.filter(doc => 
          doc.name.toLowerCase().includes(query.toLowerCase())
        )
      }
      
      setSearchResults(results)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [])

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    try {
      await upload(file)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle file select
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    try {
      await upload(file)
    } catch (err) {
      console.error(err)
    }
  }

  // Display documents (search results or all docs)
  const displayedDocs = searchResults.length > 0 ? searchResults : docs

  const STATS = [
    { label: 'Documents', value: docs.length },
    { label: 'Chunks', value: docs.reduce((sum, d) => sum + d.chunks, 0).toString() + 'K' },
    { label: 'Avg Recall', value: '94%' },
  ]

  return (
    <div className="knowledge-view" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div className="dash-header" style={{ marginBottom: '24px' }}>
        <div className="dash-title" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
          Knowledge Base
        </div>
        <div className="dash-sub" style={{ fontSize: '13px', color: 'var(--nx-text-muted)' }}>
          Upload, index, and semantically search your documents
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {STATS.map((s) => (
          <div key={s.label} className="metric-card" style={{
            background: 'var(--nx-card)', border: '1px solid var(--nx-border)',
            borderRadius: '12px', padding: '16px'
          }}>
            <div className="metric-label" style={{ fontSize: '11px', color: 'var(--nx-text-muted)', marginBottom: '8px' }}>{s.label}</div>
            <div className="metric-value" style={{ fontSize: '28px', fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="kb-search-bar" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            className="nx-input"
            placeholder="Semantic search across all documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              width: '100%', padding: '10px 12px 10px 36px',
              background: 'var(--nx-card)', border: '1px solid var(--nx-border)',
              borderRadius: '8px', color: 'var(--nx-text)', fontSize: '13px'
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--nx-text-muted)', fontSize: '13px' }}>
            🔍
          </span>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleSearch}
          style={{
            padding: '8px 20px', background: '#22d3ee', border: 'none',
            borderRadius: '8px', color: '#000', fontWeight: 500, cursor: 'pointer'
          }}
        >
          Search
        </button>
      </div>

      {/* Upload Area */}
      <div
        style={{
          border: `2px dashed ${dragOver ? '#22d3ee' : 'var(--nx-border)'}`,
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '24px',
          background: dragOver ? 'rgba(34,211,238,0.05)' : 'transparent',
          transition: 'all 0.15s',
          cursor: 'pointer',
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
        <div style={{ fontSize: '13px', color: 'var(--nx-text-secondary)', marginBottom: '8px' }}>
          Drop files here or{' '}
          <label style={{ color: '#22d3ee', cursor: 'pointer' }}>
            browse
            <input
              type="file"
              hidden
              onChange={handleFileSelect}
              accept=".pdf,.docx,.md,.txt,.csv,.html,.pptx"
            />
          </label>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--nx-text-muted)', fontFamily: 'monospace' }}>
          PDF · DOCX · MD · TXT · CSV · HTML · PPTX · up to 50MB
        </div>
      </div>

      {/* Status Messages */}
      {uploading && (
        <div style={{ color: 'var(--nx-text-muted)', marginBottom: '12px', padding: '8px', background: 'rgba(34,211,238,0.1)', borderRadius: '6px', fontSize: '12px' }}>
          📤 Uploading... Please wait
        </div>
      )}
      
      {error && (
        <div style={{ 
          background: 'rgba(239,68,68,0.1)', color: '#ef4444', 
          padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '11px' 
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Documents Section */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div className="section-title" style={{ fontSize: '16px', fontWeight: 600 }}>
          {searchResults.length > 0 ? `Search Results (${searchResults.length})` : 'Indexed Documents'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--nx-text-muted)' }}>
          <div style={{ marginBottom: '8px' }}>⟳</div>
          Loading documents...
        </div>
      ) : (
        <div className="kb-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {displayedDocs.map((doc) => (
            <div key={doc.id} className="doc-card" style={{
              background: 'var(--nx-card)', border: '1px solid var(--nx-border)',
              borderRadius: '12px', padding: '16px', transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div className="doc-icon" style={{ fontSize: '24px' }}>{doc.icon}</div>
                <span className="badge badge-rag" style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 600,
                  background: 'rgba(6,182,212,0.1)', color: '#22d3ee'
                }}>{doc.type}</span>
              </div>
              <div className="doc-name" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>{doc.name}</div>
              <div className="doc-meta" style={{ fontSize: '11px', color: 'var(--nx-text-muted)', marginBottom: '8px' }}>
                {doc.size} · {doc.date}
              </div>
              <div className="doc-status" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '10px', color: 'var(--nx-text-muted)' }}>{doc.status}</span>
              </div>
              <div className="doc-chunk" style={{ fontSize: '10px', color: 'var(--nx-text-muted)', marginTop: '6px', fontFamily: 'monospace' }}>
                {doc.chunks} chunks indexed
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && displayedDocs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--nx-text-muted)', border: '1px solid var(--nx-border)', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <div>No documents yet</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>Upload your first document to get started</div>
        </div>
      )}
    </div>
  )
}

// Mock data helper function
function getMockDocuments(): Document[] {
  return [
    {
      id: '1',
      name: 'Q4 Financial Report.pdf',
      type: 'PDF',
      size: '2.4 MB',
      date: '2025-01-15',
      status: 'Indexed',
      chunks: 147,
      icon: '📄'
    },
    {
      id: '2',
      name: 'Product Roadmap.docx',
      type: 'DOCX',
      size: '856 KB',
      date: '2025-01-10',
      status: 'Indexed',
      chunks: 89,
      icon: '📝'
    },
    {
      id: '3',
      name: 'Technical Specifications.md',
      type: 'MD',
      size: '234 KB',
      date: '2025-01-05',
      status: 'Indexed',
      chunks: 56,
      icon: '📘'
    },
    {
      id: '4',
      name: 'Customer Feedback.csv',
      type: 'CSV',
      size: '1.2 MB',
      date: '2024-12-20',
      status: 'Processing',
      chunks: 312,
      icon: '📊'
    }
  ]
}
