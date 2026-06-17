import { useMemo } from 'react'
import type { BookRecord } from '../utils/db'
import { colors } from '../utils/styles'

const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"

interface BookGridProps {
  books: BookRecord[]
  progressRecords: { filePath: string; progress: number; updatedAt: number }[]
  onOpenBook: (filePath: string) => void
  onDelete: (filePath: string) => void
  hasMore: boolean
  onLoadMore: () => void
  total: number
}

function formatRelativeTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  if (mins < 1) return '刚刚'
  if (mins < 60) return mins + '分钟前'
  if (hours < 24) {
    const d = new Date(ts)
    return '今天 ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
  }
  const yesterday = new Date(now - 86400000)
  if (
    new Date(ts).getDate() === yesterday.getDate() &&
    new Date(ts).getMonth() === yesterday.getMonth() &&
    new Date(ts).getFullYear() === yesterday.getFullYear()
  ) {
    return '昨天'
  }
  if (days < 7) return days + '天前'
  if (weeks < 5) return weeks + '周前'
  const d = new Date(ts)
  return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0')
}

const COVER_GRADIENTS = [
  'linear-gradient(160deg, #3d2b1a 0%, #1c1710 100%)',
  'linear-gradient(160deg, #2a1f15 0%, #13100c 100%)',
  'linear-gradient(160deg, #1a2530 0%, #0f1a1c 100%)',
  'linear-gradient(160deg, #2d1a15 0%, #1a0f0c 100%)',
]

const BookGlyph = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(240,235,226,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

export function BookGrid({
  books, progressRecords, onOpenBook, onDelete,
  hasMore, onLoadMore, total,
}: BookGridProps) {
  const progressMap = useMemo(() => new Map(progressRecords.map(p => [p.filePath, p])), [progressRecords])

  if (books.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
      }}>
        <div style={{
          padding: '40px 48px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          background: 'rgba(19, 16, 12, 0.4)', borderRadius: 2,
          border: `1px solid ${colors.border}`,
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: colors.text, fontFamily: fontDisplay }}>没有找到匹配的书</p>
          <p style={{ fontSize: 13, margin: 0, color: colors.textMuted, lineHeight: 1.5 }}>试试其他关键词或筛选条件</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '20px 14px',
        justifyItems: 'center',
        padding: '16px 16px 32px',
      }}>
        {books.map((book, i) => {
          const coverBg = COVER_GRADIENTS[i % COVER_GRADIENTS.length]
          const progress = progressMap.get(book.filePath)
          return (
            <div key={book.filePath} style={{
              position: 'relative',
              borderRadius: 2,
              background: 'rgba(19, 16, 12, 0.4)',
              border: `1px solid ${colors.border}`,
              padding: '14px 10px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              cursor: 'pointer',
              width: '100%', maxWidth: 148,
              backdropFilter: 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: 'blur(20px) saturate(140%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), border-color 0.15s',
            }}
              onClick={() => onOpenBook(book.filePath)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = colors.borderAmber }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.borderColor = colors.border }}
            >
              <div style={{
                width: '100%', aspectRatio: '3/4', maxWidth: 110,
                borderRadius: 2, overflow: 'hidden', flexShrink: 0,
                boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                background: !book.cover ? coverBg : undefined,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {book.cover ? (
                  <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <BookGlyph />
                )}
              </div>

              <div style={{ marginTop: 8, textAlign: 'center', width: '100%' }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: colors.text,
                  fontFamily: fontDisplay,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
                }}>{book.title}</div>
                <div style={{
                  fontSize: 11, color: colors.textMuted, marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{book.author}</div>

                {progress && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{
                      width: '100%', height: 3, borderRadius: 2,
                      background: 'rgba(240,235,226,0.07)', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: progress.progress + '%', height: '100%', borderRadius: 2,
                        background: `linear-gradient(90deg, ${colors.amber}, rgba(180,110,40,0.8))`,
                        boxShadow: progress.progress > 0 ? `0 0 4px ${colors.amberGlow}` : 'none',
                      }} />
                    </div>
                    <div style={{
                      fontSize: 10, color: '#e8a04a', marginTop: 3, fontFamily: fontDisplay,
                    }}>
                      {formatRelativeTime(progress.updatedAt)}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={(e) => { e.stopPropagation(); onDelete(book.filePath) }}
                title="删除"
                style={{
                  position: 'absolute', top: -6, right: -6, zIndex: 2,
                  width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: 'rgba(192,84,74,0.85)', color: '#fff', fontSize: 11, lineHeight: '22px',
                  textAlign: 'center', padding: 0, opacity: 0.7,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.7' }}
              >✕</button>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div style={{ padding: '0 16px 24px', textAlign: 'center' }}>
          <button onClick={onLoadMore} style={{
            padding: '10px 32px', borderRadius: 2, cursor: 'pointer',
            background: 'rgba(240,235,226,0.06)',
            border: `1px solid ${colors.border}`,
            color: colors.textMuted, fontSize: 13, fontWeight: 600,
            fontFamily: fontDisplay,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = colors.borderAmber; el.style.color = colors.amber }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = colors.border; el.style.color = colors.textMuted }}
          >加载更多 ({books.length}/{total})</button>
        </div>
      )}
    </div>
  )
}
