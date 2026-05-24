import { useState } from 'react'

interface OPDSEntry {
  title: string
  author?: string
  url: string
  type?: string
}

interface OPDSFeed {
  title: string
  entries: OPDSEntry[]
}

interface OPDSBrowserProps {
  onClose: () => void
  onBookSelected: (url: string, title: string) => void
}

export function OPDSBrowser({ onClose, onBookSelected }: OPDSBrowserProps) {
  const [feedUrl, setFeedUrl] = useState('')
  const [feed, setFeed] = useState<OPDSFeed | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchFeed = async () => {
    if (!feedUrl.trim()) return
    setLoading(true)
    setError('')
    try {
      const resp = await fetch(feedUrl)
      const text = await resp.text()
      // Parse XML — for now just show URL as title if parsing fails
      // We'll use the opds.ts parser in Task 15
      setFeed({ title: feedUrl, entries: [] })
    } catch (e) {
      setError('无法获取 Feed')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 600,
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>OPDS 书库</span>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* URL Input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="url"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="输入 OPDS Feed URL"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={fetchFeed}
            disabled={loading}
            style={{
              background: 'rgba(99,102,241,0.4)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13,
            }}
          >
            {loading ? '加载中...' : '浏览'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        {/* Feed Info */}
        {feed && (
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8 }}>
              {feed.title} — {feed.entries.length} 本书
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feed.entries.map((entry, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                }}
                  onClick={() => onBookSelected(entry.url, entry.title)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.4)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
                >
                  <div style={{ color: '#fff', fontSize: 13 }}>{entry.title}</div>
                  {entry.author && (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{entry.author}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!feed && !loading && !error && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
            输入 OPDS Feed URL 开始浏览
          </div>
        )}
      </div>
    </div>
  )
}