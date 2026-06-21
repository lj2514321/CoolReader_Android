import { useState, useMemo, useRef, useCallback } from 'react'
import type { BookRecord } from '../utils/db'
import { colors } from '../utils/styles'
import { hapticHeavy, hapticLight } from '../utils/mobile'

interface BookShelfProps {
  books: BookRecord[]
  readingTime: number
  readingGoal: number
  progressRecords: { filePath: string; progress: number; updatedAt: number }[]
  onOpenBook: (filePath: string) => void
  onDelete: (filePath: string, deleteFile: boolean) => void
  onImport: () => void
}

type SortKey = 'title' | 'author' | 'recent'

/** 长按 hook — 500ms 触发，触摸移动自动取消 */
function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const posRef = useRef<{ x: number; y: number } | null>(null)

  const start = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    posRef.current = { x: touch.clientX, y: touch.clientY }
    timerRef.current = setTimeout(() => {
      callback()
      timerRef.current = null
    }, ms)
  }, [callback, ms])

  const move = useCallback((e: React.TouchEvent) => {
    if (!posRef.current) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - posRef.current.x)
    const dy = Math.abs(touch.clientY - posRef.current.y)
    if (dx > 10 || dy > 10) cancel()
  }, [])

  const cancel = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    posRef.current = null
  }, [])

  return { onTouchStart: start, onTouchMove: move, onTouchEnd: cancel, onTouchCancel: cancel }
}

/* 暖墨色封面渐变 — 模拟老书纸面 */
const coverGradients = [
  'linear-gradient(165deg, #3d2b1a 0%, #1c1408 60%, #0a0807 100%)',
  'linear-gradient(180deg, #2a1f15 0%, #1a1208 100%)',
  'linear-gradient(155deg, #2d1a15 0%, #1a0f0c 100%)',
  'linear-gradient(170deg, #1f1810 0%, #0f0a07 100%)',
  'linear-gradient(160deg, #251a12 0%, #13100c 100%)',
  'linear-gradient(175deg, #2e1f0f 0%, #1a1308 100%)',
]

/* ── icons ─────────────────────────────────────────── */
const ClockIcon = ({ size = 14, color }: { size?: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9.5"/><polyline points="12 6.5 12 12 15.5 14"/>
  </svg>
)

const SearchIcon = ({ size = 16, color }: { size?: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
    <circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.5" y2="15.5"/>
  </svg>
)

const BookIcon = ({ size = 14, color }: { size?: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

const PlusIcon = ({ size = 22, color }: { size?: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const TrashIcon = ({ size = 16, color }: { size?: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

/* ── helpers ───────────────────────────────────────── */
function formatRelativeTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  if (hours < 24) {
    const d = new Date(ts)
    return '今天 ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
  }
  if (days < 7) return `${days}天前`
  if (weeks < 5) return `${weeks}周前`
  const d = new Date(ts)
  return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0')
}

/* ── main component ────────────────────────────────── */
export function BookShelf({ books, readingTime, readingGoal, progressRecords, onOpenBook, onDelete, onImport }: BookShelfProps) {
  const [confirmPath, setConfirmPath] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressPos = useRef<{ x: number; y: number } | null>(null)

  const progressMap = useMemo(() => new Map(progressRecords.map(p => [p.filePath, p])), [progressRecords])

  const recentBooks = useMemo(() => {
    const withProgress = books
      .filter(b => progressMap.has(b.filePath))
      .map(b => ({ book: b, progress: progressMap.get(b.filePath)! }))
      .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt)
      .slice(0, 5)
    return withProgress
  }, [books, progressMap])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = q ? books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) : books
    list = [...list].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title)
      if (sortKey === 'author') return a.author.localeCompare(b.author)
      if (sortKey === 'recent') {
        const pa = progressMap.get(a.filePath)
        const pb = progressMap.get(b.filePath)
        return (pb?.updatedAt ?? 0) - (pa?.updatedAt ?? 0)
      }
      return 0
    })
    return list
  }, [books, search, sortKey, progressMap])

  const goalPct = readingGoal > 0 ? Math.min(100, Math.round(readingTime / 60 / readingGoal * 100)) : 0
  const hours = Math.floor(readingTime / 3600)
  const minutes = Math.floor((readingTime % 3600) / 60)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', position: 'relative',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* ── Reading time header — flat, lamp glow ─────── */}
      <div style={{ position: 'relative', padding: '24px 20px 18px', flexShrink: 0 }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(232,160,74,0.12) 0%, transparent 60%)',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{
              fontFamily: 'Georgia, "Noto Serif SC", serif',
              fontSize: 36, fontWeight: 400,
              color: colors.amber, letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {hours}<span style={{ fontSize: 18, color: colors.textMuted, marginLeft: 2 }}>时</span>
              {' '}
              {minutes}<span style={{ fontSize: 18, color: colors.textMuted, marginLeft: 2 }}>分</span>
            </div>
            <div style={{
              fontSize: 11, color: colors.textMuted, fontWeight: 500,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              marginTop: 6,
            }}>
              今日灯下
            </div>
          </div>
          {readingGoal > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: 22, fontWeight: 400, color: colors.text,
                lineHeight: 1, letterSpacing: '-0.01em',
              }}>
                {goalPct}<span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 1 }}>%</span>
              </div>
              <div style={{ fontSize: 10, color: colors.textFaint, marginTop: 4, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {Math.floor(readingTime / 60)} / {readingGoal}min
              </div>
            </div>
          )}
        </div>
        {readingGoal > 0 && (
          <div style={{ position: 'relative', marginTop: 14, height: 3, background: 'rgba(240,235,226,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: goalPct + '%',
              background: `linear-gradient(90deg, ${colors.amber} 0%, #e8a04a 100%)`,
              boxShadow: `0 0 8px ${colors.amberGlow}`,
              borderRadius: 2,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        )}
      </div>

      {/* ── Search — borderless, line underline ───────── */}
      <div style={{ position: 'relative', margin: '0 20px', flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <SearchIcon size={15} color={colors.textMuted} />
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜书名或作者"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '12px 8px 12px 32px',
            background: 'transparent',
            border: 'none',
            borderBottom: `1px solid ${colors.border}`,
            color: colors.text, fontSize: 14,
            outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = colors.amber }}
          onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = colors.border }}
        />
      </div>

      {/* ── Continue Reading — horizontal scroll ──────── */}
      {recentBooks.length > 0 && (
        <div style={{ margin: '24px 20px 0', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <span style={{
              fontFamily: 'Georgia, "Noto Serif SC", serif',
              fontSize: 15, fontWeight: 400, color: colors.text,
              letterSpacing: '0.04em',
            }}>
              继续读
            </span>
            <span style={{ fontSize: 10, color: colors.textFaint, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              {recentBooks.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 6 }}>
            {recentBooks.map(({ book, progress }) => (
              <div key={book.filePath}
                onClick={() => onOpenBook(book.filePath)}
                style={{
                  flexShrink: 0, width: 88,
                  cursor: 'pointer', position: 'relative',
                }}
              >
                {/* Cover */}
                <div style={{
                  width: '100%', height: 118, overflow: 'hidden',
                  background: coverGradients[0],
                  boxShadow: '0 6px 18px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(240,235,226,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {/* lamp top highlight */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                    background: 'linear-gradient(180deg, rgba(232,160,74,0.10) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />
                  {book.cover ? (
                    <img src={book.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{
                      fontFamily: 'Georgia, "Noto Serif SC", serif',
                      fontSize: 24, color: 'rgba(240,235,226,0.3)',
                      fontWeight: 400,
                    }}>书</span>
                  )}
                  {/* flame progress at bottom */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, height: 3,
                    background: 'rgba(240,235,226,0.10)',
                  }}>
                    <div style={{
                      width: progress.progress + '%', height: '100%',
                      background: `linear-gradient(90deg, #ff7b3a 0%, #e8a04a 60%, ${colors.amber} 100%)`,
                      boxShadow: '0 0 6px rgba(255,123,58,0.6)',
                    }} />
                  </div>
                </div>
                {/* Title */}
                <div style={{
                  fontFamily: 'Georgia, "Noto Serif SC", serif',
                  fontSize: 12, fontWeight: 400, color: colors.text,
                  marginTop: 8, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {book.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sort tabs — text only, underline indicator ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        margin: '24px 20px 0',
        flexShrink: 0,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        {([
          { key: 'title' as const, label: '书架' },
          { key: 'author' as const, label: '作者' },
          { key: 'recent' as const, label: '最近' },
        ] as { key: SortKey; label: string }[]).map(s => (
          <button key={s.key} onClick={() => setSortKey(s.key)}
            style={{
              padding: '8px 0',
              background: 'transparent', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
              fontFamily: 'Georgia, "Noto Serif SC", serif',
              color: sortKey === s.key ? colors.text : colors.textMuted,
              position: 'relative', letterSpacing: '0.06em',
              transition: 'color 0.2s',
            }}
          >
            {s.label}
            {sortKey === s.key && (
              <span style={{
                position: 'absolute', left: 0, right: 0, bottom: -1,
                height: 2, background: colors.amber,
                boxShadow: `0 0 6px ${colors.amberGlow}`,
              }} />
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: colors.textFaint, fontFamily: 'monospace', letterSpacing: '0.08em', paddingBottom: 8 }}>
          {filtered.length}
        </span>
      </div>

      {/* ── Book grid — vertical spine + cover ────────── */}
      {filtered.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 32px', gap: 20, textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'Georgia, "Noto Serif SC", serif',
            fontSize: 48, color: 'rgba(212,146,58,0.25)',
            fontWeight: 400, lineHeight: 1,
          }}>
            ·
          </div>
          <p style={{
            fontFamily: 'Georgia, "Noto Serif SC", serif',
            fontSize: 18, fontWeight: 400,
            margin: 0, color: colors.text, letterSpacing: '0.04em',
          }}>
            书架空着
          </p>
          <p style={{
            fontSize: 12, margin: 0, color: colors.textMuted,
            lineHeight: 1.7, letterSpacing: '0.04em',
          }}>
            从右下角装入第一本<br/>夜读便有了归处
          </p>
          <button onClick={onImport} style={{
            marginTop: 12, padding: '10px 24px', cursor: 'pointer',
            background: 'transparent',
            border: `1px solid ${colors.amber}`,
            borderRadius: 0,
            color: colors.amber, fontSize: 13, fontWeight: 500,
            fontFamily: 'Georgia, "Noto Serif SC", serif',
            letterSpacing: '0.12em',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = colors.amber
              ;(e.currentTarget as HTMLElement).style.color = '#0a0807'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = colors.amber
            }}
          >
            装 入 书 籍
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '16px 20px 120px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: '24px 12px',
            justifyItems: 'center',
          }}>
            {filtered.map((book, i) => {
              const coverBg = coverGradients[i % coverGradients.length]
              const prog = progressMap.get(book.filePath)
              return (
                <div key={book.filePath}
                  onClick={() => { hapticLight(); onOpenBook(book.filePath) }}
                  onTouchStart={e => {
                    const touch = e.touches[0]
                    longPressPos.current = { x: touch.clientX, y: touch.clientY }
                    longPressTimer.current = setTimeout(() => {
                      hapticHeavy()
                      setConfirmPath(book.filePath)
                      longPressTimer.current = null
                    }, 500)
                  }}
                  onTouchMove={e => {
                    if (!longPressPos.current) return
                    const touch = e.touches[0]
                    if (Math.abs(touch.clientX - longPressPos.current.x) > 10 || Math.abs(touch.clientY - longPressPos.current.y) > 10) {
                      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
                      longPressPos.current = null
                    }
                  }}
                  onTouchEnd={() => {
                    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
                    longPressPos.current = null
                  }}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: 110,
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                  }}
                >
                  {/* Cover with spine shadow */}
                  <div style={{
                    width: '100%', aspectRatio: '2/3',
                    maxWidth: 96,
                    background: coverBg,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(240,235,226,0.04)',
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {/* spine shadow on left */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
                      background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
                      pointerEvents: 'none',
                    }} />
                    {/* lamp top glow */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                      background: 'linear-gradient(180deg, rgba(232,160,74,0.08) 0%, transparent 100%)',
                      pointerEvents: 'none',
                    }} />
                    {book.cover ? (
                      <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{
                        fontFamily: 'Georgia, "Noto Serif SC", serif',
                        fontSize: 22, color: 'rgba(240,235,226,0.25)',
                        fontWeight: 400,
                      }}>书</span>
                    )}
                    {/* spine progress indicator on left edge */}
                    {prog && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                        background: 'rgba(240,235,226,0.08)',
                      }}>
                        <div style={{
                          position: 'absolute', left: 0, right: 0, top: `${100 - prog.progress}%`, bottom: 0,
                          background: `linear-gradient(180deg, #ff7b3a 0%, #e8a04a 50%, ${colors.amber} 100%)`,
                          boxShadow: '0 0 4px rgba(255,123,58,0.5)',
                        }} />
                      </div>
                    )}
                  </div>
                  {/* Title */}
                  <div style={{
                    fontFamily: 'Georgia, "Noto Serif SC", serif',
                    fontSize: 12, fontWeight: 400,
                    color: colors.text,
                    marginTop: 8, lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}>{book.title}</div>
                  {/* Author / last read */}
                  {prog ? (
                    <div style={{
                      fontSize: 10, color: colors.textFaint,
                      marginTop: 2, fontFamily: 'monospace',
                      textAlign: 'center', letterSpacing: '0.04em',
                    }}>
                      {formatRelativeTime(prog.updatedAt)}
                    </div>
                  ) : book.author ? (
                    <div style={{
                      fontSize: 10, color: colors.textFaint,
                      marginTop: 2,
                      textAlign: 'center',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{book.author}</div>
                  ) : null}
                  {/* Long-press delete indicator — top-right corner mark */}
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmPath(book.filePath) }}
                    title="删除"
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 18, height: 18,
                      border: 'none', cursor: 'pointer',
                      background: 'rgba(192, 84, 74, 0.7)',
                      color: '#f0ebe2', fontSize: 9, lineHeight: '18px',
                      textAlign: 'center', padding: 0,
                      opacity: 0, transition: 'opacity 0.15s',
                      borderRadius: 0,
                    }}
                    className="book-delete-btn"
                  >✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Show delete button on touch/hover for non-touch devices */}
      <style>{`.book-delete-btn { opacity: 0; pointer-events: none; }
        [class*="cr-card"]:hover .book-delete-btn,
        div:hover > .book-delete-btn { opacity: 1; pointer-events: auto; }
      `}</style>

      {/* ── FAB — square with corner cut, seal-red ──────── */}
      {books.length > 0 && (
        <button onClick={onImport}
          title="导入书籍"
          style={{
            position: 'absolute', bottom: 24, right: 20,
            width: 48, height: 48,
            border: 'none', cursor: 'pointer',
            background: '#a8431e',
            color: '#f4ead5',
            boxShadow: '0 6px 20px rgba(168,67,30,0.45), inset 0 0 0 1px rgba(244,234,213,0.1)',
            zIndex: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s var(--cr-ease-spring), box-shadow 0.2s',
            /* corner cut via clip-path */
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
        >
          <PlusIcon size={20} color="#f4ead5" />
        </button>
      )}

      {/* ── Delete confirm dialog ──────────────────────── */}
      {confirmPath && (
        <div onClick={() => setConfirmPath(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(10,8,7,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: colors.bgFloat,
            border: `1px solid ${colors.border}`,
            borderRadius: 0,
            padding: '32px 32px 24px',
            textAlign: 'center', maxWidth: 320,
            boxShadow: '0 16px 60px rgba(0,0,0,0.7)',
          }}>
            <div style={{
              width: 44, height: 44, margin: '0 auto 16px',
              border: `1px solid ${colors.red}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrashIcon size={20} color={colors.red} />
            </div>
            <p style={{
              fontFamily: 'Georgia, "Noto Serif SC", serif',
              color: colors.text, fontSize: 16, fontWeight: 400,
              margin: '0 0 8px', letterSpacing: '0.04em',
            }}>
              移出书架
            </p>
            <p style={{ color: colors.textMuted, fontSize: 12, margin: '0 0 24px', lineHeight: 1.6, letterSpacing: '0.04em' }}>
              此书将从你的书架中消失
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => { onDelete(confirmPath, true); setConfirmPath(null) }}
                style={{
                  padding: '11px 20px', cursor: 'pointer', borderRadius: 0,
                  background: 'rgba(192, 84, 74, 0.15)',
                  border: `1px solid rgba(192,84,74,0.4)`,
                  color: colors.red, fontSize: 13, fontWeight: 500,
                  fontFamily: 'Georgia, "Noto Serif SC", serif',
                  letterSpacing: '0.08em',
                  transition: 'all 0.15s',
                }}
              >连同文件删除</button>
              <button onClick={() => { onDelete(confirmPath, false); setConfirmPath(null) }}
                style={{
                  padding: '11px 20px', cursor: 'pointer', borderRadius: 0,
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.text, fontSize: 13, fontWeight: 500,
                  fontFamily: 'Georgia, "Noto Serif SC", serif',
                  letterSpacing: '0.08em',
                }}
              >仅从书架移除</button>
              <button onClick={() => setConfirmPath(null)}
                style={{
                  padding: '8px', cursor: 'pointer', borderRadius: 0,
                  background: 'none', border: 'none',
                  color: colors.textFaint, fontSize: 11, marginTop: 8,
                  fontFamily: 'Georgia, "Noto Serif SC", serif',
                  letterSpacing: '0.12em',
                }}
              >取 消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
