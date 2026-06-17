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
      setFeed({ title: feedUrl, entries: [] })
    } catch {
      setError('无法获取 Feed')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,8,7,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'rgba(10,8,7,0.97)',
        border: '1px solid rgba(212,146,58,0.25)',
        borderRadius: 16,
        padding: 24,
        width: '100%', maxWidth: 600, maxHeight: '80vh',
        overflowY: 'auto',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ color: '#f0ebe2', fontSize: 16, fontWeight: 700 }}>OPDS 书库</span>
          <button onClick={onClose} style={{ color: 'rgba(240,235,226,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {/* URL Input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="url" value={feedUrl}
            onChange={e => setFeedUrl(e.target.value)}
            placeholder="输入 OPDS Feed URL"
            style={{
              flex: 1,
              background: 'rgba(240,235,226,0.07)',
              border: '1px solid rgba(212,146,58,0.20)',
              borderRadius: 10,
              padding: '10px 14px',
              color: '#f0ebe2', fontSize: 13,
              outline: 'none',
            }}
          />
          <button onClick={fetchFeed} disabled={loading}
            style={{
              background: loading ? 'rgba(212,146,58,0.4)' : '#d4923a',
              color: loading ? 'rgba(240,235,226,0.5)' : '#0a0807',
              fontWeight: 700, border: 'none', borderRadius: 10,
              padding: '10px 18px', cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 4px 16px rgba(212,146,58,0.3)',
              transition: 'all 0.15s',
            }}
          >{loading ? '加载中...' : '浏览'}</button>
        </div>

        {error && <div style={{ color: '#c0544a', fontSize: 12, marginBottom: 12 }}>{error}</div>}

        {feed && (
          <div>
            <div style={{ color: 'rgba(240,235,226,0.5)', fontSize: 12, marginBottom: 8 }}>
              {feed.title} — {feed.entries.length} 本书
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feed.entries.map((entry, i) => (
                <div key={i}
                  onClick={() => onBookSelected(entry.url, entry.title)}
                  style={{
                    background: 'rgba(240,235,226,0.04)',
                    borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                    border: '1px solid transparent',
                    transition: 'border-color 0.12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,146,58,0.35)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
                >
                  <div style={{ color: '#f0ebe2', fontSize: 13, fontWeight: 600 }}>{entry.title}</div>
                  {entry.author && (
                    <div style={{ color: 'rgba(240,235,226,0.35)', fontSize: 11, marginTop: 3 }}>{entry.author}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!feed && !loading && !error && (
          <div style={{ color: 'rgba(240,235,226,0.25)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
            输入 OPDS Feed URL 开始浏览
          </div>
        )}
      </div>
    </div>
  )
}
