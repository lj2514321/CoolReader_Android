import { useRef, useEffect } from 'react'
import type { SortKey, FilterStatus } from '../hooks/useBookSearch'
import { colors } from '../utils/styles'

const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"
const fontBody = "system-ui, -apple-system, 'Segoe UI', sans-serif"

interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  sortKey: SortKey
  onSortChange: (key: SortKey) => void
  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
  history: string[]
  showHistory: boolean
  onShowHistory: (show: boolean) => void
  onSelectHistory: (term: string) => void
  onRemoveHistory: (term: string) => void
  onClearHistory: () => void
  onSubmitSearch: () => void
  resultCount: number
}

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'title', label: '书名' },
  { key: 'author', label: '作者' },
  { key: 'recent', label: '最近' },
]

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'reading', label: '在读' },
  { key: 'finished', label: '已读' },
]

export function SearchBar({
  query, onQueryChange,
  sortKey, onSortChange,
  filterStatus, onFilterChange,
  history, showHistory, onShowHistory,
  onSelectHistory, onRemoveHistory, onClearHistory,
  onSubmitSearch,
  resultCount,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close history dropdown on outside click
  useEffect(() => {
    if (!showHistory) return
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showHistory, onShowHistory])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmitSearch()
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      onShowHistory(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Search input */}
      <div ref={wrapperRef} style={{ position: 'relative', margin: '16px 16px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          borderRadius: 2,
          border: `1px solid ${colors.border}`,
          background: 'rgba(19, 16, 12, 0.4)',
          overflow: 'hidden',
        }}>
          <span style={{
            padding: '0 0 0 14px', fontSize: 14,
            color: colors.textMuted,
            userSelect: 'none',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onFocus={() => onShowHistory(true)}
            onKeyDown={handleKeyDown}
            placeholder="搜索书名或作者…"
            style={{
              flex: 1, padding: '10px 10px 10px 8px',
              background: 'none', border: 'none',
              color: colors.text, fontSize: 13, outline: 'none',
            }}
          />
          {query && (
            <button
              onClick={() => { onQueryChange(''); onShowHistory(false) }}
              style={{
                padding: '0 12px', background: 'none', border: 'none',
                color: colors.textMuted, cursor: 'pointer', fontSize: 14,
              }}
            >✕</button>
          )}
        </div>

        {/* History dropdown */}
        {showHistory && history.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            marginTop: 4, zIndex: 20,
            background: 'var(--cr-glass-bg, rgba(28, 23, 16, 0.72))',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            border: `1px solid ${colors.border}`,
            borderRadius: 2,
            padding: '6px 0',
            maxHeight: 240, overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '4px 14px 8px',
            }}>
              <span style={{ fontSize: 11, color: colors.textFaint, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontFamily: fontDisplay }}>搜索历史</span>
              <button onClick={onClearHistory} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: colors.textFaint,
              }}>清空</button>
            </div>
            {history.map((term) => (
              <div key={term}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 14px', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,235,226,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                onClick={() => { onSelectHistory(term); onShowHistory(false) }}
              >
                <span style={{ fontSize: 13, color: colors.textMuted }}>🕐 {term}</span>
                <button
                  onClick={e => { e.stopPropagation(); onRemoveHistory(term) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: colors.textFaint, padding: '0 4px',
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter + Sort row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        margin: '10px 16px 0',
        flexWrap: 'wrap',
      }}>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {filterOptions.map(f => {
            const isActive = filterStatus === f.key
            return (
            <button key={f.key} onClick={() => onFilterChange(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 2, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const,
                fontFamily: fontDisplay,
                background: isActive ? 'rgba(212,146,58,0.20)' : 'rgba(240,235,226,0.05)',
                border: `1px solid ${isActive ? 'rgba(212,146,58,0.35)' : 'rgba(240,235,226,0.08)'}`,
                color: isActive ? '#e8a04a' : 'rgba(240,235,226,0.5)',
                transition: 'all 0.15s',
              }}
            >{f.label}</button>
            )
          })}
          ))}
        </div>

        {/* Sort selector */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {sortOptions.map(s => {
            const isActive = sortKey === s.key
            return (
            <button key={s.key} onClick={() => onSortChange(s.key)}
              style={{
                padding: '5px 12px', borderRadius: 2, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const,
                fontFamily: fontDisplay,
                background: isActive ? 'rgba(212,146,58,0.20)' : 'rgba(240,235,226,0.05)',
                border: `1px solid ${isActive ? 'rgba(212,146,58,0.35)' : 'rgba(240,235,226,0.08)'}`,
                color: isActive ? '#e8a04a' : 'rgba(240,235,226,0.5)',
                transition: 'all 0.15s',
              }}
            >{s.label}</button>
            )
          })}
        </div>
      </div>

      {/* Result count */}
      {(query || filterStatus !== 'all') && (
        <div style={{
          margin: '8px 16px 0',
          fontSize: 12, color: colors.textFaint, fontFamily: fontDisplay,
        }}>
          找到 {resultCount} 本书
        </div>
      )}
    </div>
  )
}
