import { useState, useMemo } from 'react'
import type { BookRecord } from '../utils/db'
import { glass, colors } from '../utils/styles'

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
  const yesterday = new Date(now - 86400000)
  if (
    new Date(ts).getDate() === yesterday.getDate() &&
    new Date(ts).getMonth() === yesterday.getMonth() &&
    new Date(ts).getFullYear() === yesterday.getFullYear()
  ) {
    return '昨天'
  }
  if (days < 7) return `${days}天前`
  if (weeks < 5) return `${weeks}周前`
  const d = new Date(ts)
  return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0')
}

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

export function BookShelf({ books, readingTime, readingGoal, progressRecords, onOpenBook, onDelete, onImport }: BookShelfProps) {
  const [confirmPath, setConfirmPath] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('title')

  const progressMap = useMemo(() => new Map(progressRecords.map(p => [p.filePath, p])), [progressRecords])

  const recentBooks = useMemo(() => {
    const withProgress = books
      .filter(b => progressMap.has(b.filePath))
      .map(b => ({ book: b, progress: progressMap.get(b.filePath)! }))
      .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt)
      .slice(0, 5)
    return withProgress
  }, [books, progressMap])

  const recentPaths = useMemo(() => new Set(recentBooks.map(r => r.book.filePath)), [recentBooks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = q ? books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) : books
    if (!q && sortKey !== 'recent') list = list.filter(b => !recentPaths.has(b.filePath))
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
  }, [books, search, sortKey, recentPaths, progressMap])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{
        margin: '24px 16px 0 16px',
        padding: '14px 24px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.1) 100%)',
        borderRadius: 14,
        border: '1px solid rgba(168,85,247,0.15)',
        display: 'flex', alignItems: 'center', gap: 16,
        flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{readingGoal > 0 ? '🎯' : '⏱'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: -0.3, lineHeight: 1.3 }}>
            {Math.floor(readingTime / 3600)}h {Math.floor((readingTime % 3600) / 60)}m
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500, marginTop: 1 }}>
            今日阅读
          </div>
          {readingGoal > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: (Math.min(100, Math.round(readingTime / 60 / readingGoal * 100)) + '%'), height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #6366f1, #a855f7)', transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                {Math.floor(readingTime / 60)}m / {readingGoal}m
              </span>
            </div>
          )}
        </div>
      </div>

      {/* continue reading */}
      {recentBooks.length > 0 && (
        <div style={{ margin: '16px 16px 0', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: -0.2 }}>📖 继续阅读</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {recentBooks.map(({ book, progress }) => (
              <div key={book.filePath} onClick={() => onOpenBook(book.filePath)}
                style={{
                  flexShrink: 0, width: 110, borderRadius: 12, cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
                  border: '1px solid rgba(168,85,247,0.12)',
                  padding: '10px 8px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
              >
                <div style={{
                  width: 64, height: 86, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
                  background: !book.cover ? 'linear-gradient(135deg, #6366f1, #a855f7)' : undefined,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {book.cover ? (
                    <img src={book.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 20, opacity: 0.5 }}>📖</span>
                  )}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {book.title}
                </div>
                <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: (progress.progress + '%'), height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* search */}
      <div style={{ margin: '16px 16px 4px', flexShrink: 0 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索书名或作者…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 14px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, outline: 'none',
          }}
        />
      </div>
      {/* sort */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '0 16px 0', flexShrink: 0 }}>
        {[{ key: 'title' as const, label: '书名' }, { key: 'author' as const, label: '作者' }, { key: 'recent' as const, label: '最近' }].map(s => (
          <button key={s.key} onClick={() => setSortKey(s.key)}
            style={{
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: sortKey === s.key ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (sortKey === s.key ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'),
              color: sortKey === s.key ? '#6366f1' : 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap',
            }}
          >{s.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...glass, padding: '56px 72px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 56, opacity: 0.5 }}>📚</div>
            <p style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'rgba(255,255,255,0.7)' }}>还没有书</p>
            <p style={{ fontSize: 14, margin: 0, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
              选择 EPUB 文件开始阅读
            </p>
            <button onClick={onImport} style={{
              padding: '10px 28px', borderRadius: 12, cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
              marginTop: 8,
            }}>📥 导入书籍</button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '28px 16px 32px 16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '24px 16px',
            justifyItems: 'center',
          }}>
            {filtered.map((book, i) => {
              const [c1, c2] = colors[i % colors.length]
              return (
                <div key={book.filePath} style={{
                  position: 'relative',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
                  border: '1px solid rgba(168,85,247,0.12)',
                  padding: '16px 10px 14px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: 148,
                }}
                  onClick={() => onOpenBook(book.filePath)}
                >
                  <div style={{
                    width: '100%', aspectRatio: '3/4', maxWidth: 110,
                    borderRadius: 10,
                    overflow: 'hidden',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                    background: !book.cover ? ('linear-gradient(135deg, ' + c1 + ', ' + c2 + ')') : undefined,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {book.cover ? (
                      <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 32, opacity: 0.5 }}>📖</span>
                    )}
                  </div>
                  <div style={{ marginTop: 10, textAlign: 'center', width: '100%' }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                    }}>{book.title}</div>
                    <div style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{book.author}</div>
                    {progressMap.has(book.filePath) && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3, lineHeight: 1.2 }}>
                        {formatRelativeTime(progressMap.get(book.filePath)!.updatedAt)}
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'absolute', top: -6, right: -6, zIndex: 2 }}>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmPath(book.filePath) }}
                      style={{
                        width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: 'rgba(220,38,38,0.7)', color: '#fff', fontSize: 12, lineHeight: '24px',
                        textAlign: 'center', padding: 0, opacity: 0.6,
                        transition: 'opacity 0.15s',
                      }}
                    >✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {confirmPath && (
        <div onClick={() => setConfirmPath(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(15,12,41,0.9)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 16, padding: '32px 36px',
            border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center', maxWidth: 340,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
            <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>确认删除</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
              删除后将无法恢复
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => { onDelete(confirmPath, true); setConfirmPath(null) }}
                style={{
                  padding: '10px 20px', cursor: 'pointer', borderRadius: 10,
                  background: 'rgba(220,38,38,0.3)', border: '1px solid rgba(220,38,38,0.3)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                }}
              >删除文件并移出书架</button>
              <button onClick={() => { onDelete(confirmPath, false); setConfirmPath(null) }}
                style={{
                  padding: '10px 20px', cursor: 'pointer', borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                }}
              >仅移出书架</button>
              <button onClick={() => setConfirmPath(null)}
                style={{
                  padding: '8px', cursor: 'pointer', borderRadius: 10,
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)', fontSize: 12,
                  marginTop: 4,
                }}
              >取消</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB import button */}
      {books.length > 0 && (
        <button onClick={onImport}
          style={{
            position: 'absolute', bottom: 20, right: 20,
            width: 52, height: 52, borderRadius: '50%',
            border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff', fontSize: 26, lineHeight: '52px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            zIndex: 5,
          }}
        >+</button>
      )}
    </div>
  )
}
