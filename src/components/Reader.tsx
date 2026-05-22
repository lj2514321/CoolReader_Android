import { useEffect, useRef, useState } from 'react'
import { BookMeta, ThemeMode, AIConfig, NavItem, ReaderLayout, Bookmark, Highlight, SearchResult, CustomTheme, defaultCustomTheme } from '../types'
import { CustomThemePanel } from './CustomThemePanel'
import { AIPanel } from './AIPanel'
import { Sidebar } from './Sidebar'
import { LayoutPanel } from './LayoutPanel'
import { MarkersPanel } from './MarkersPanel'
import { SelectionToolbar } from './SelectionToolbar'

interface ReaderProps {
  filePath: string | null
  meta: BookMeta | null
  theme: ThemeMode
  progress: number
  toc: NavItem[]
  onLoad: (path: string) => void
  onBack: () => void
  onNext: () => void
  onPrev: () => void
  onNavigate: (href: string) => void
  currentHref: string
  layout: ReaderLayout
  onLayoutChange: (patch: Partial<ReaderLayout>) => void
  onThemeChange: (t: ThemeMode) => void
  bookmarks: Bookmark[]
  bookmarkCfi: string
  highlights: Highlight[]
  selectionInfo: { text: string; cfiRange: string; bounds: { top: number; left: number; width: number; height: number } } | null
  onToggleBookmark: () => void
  onNavigateCfi: (cfi: string) => void
  onDeleteBookmark: (id: number) => void
  onAddHighlight: (color: string) => void
  onRemoveHighlight: (id: number, cfiRange: string) => void
  onClearSelection: () => void
  onSeek: (pct: number) => void
  onResize?: () => void
  aiConfig?: AIConfig | null
  onGetChapterText?: () => Promise<string>
  onGetFullBookText?: () => Promise<string>
  onSearch?: (query: string) => Promise<SearchResult[]>
  onNavigateToSearchResult?: (result: SearchResult) => void
  customTheme?: CustomTheme
  onCustomThemeChange?: (t: CustomTheme) => void
}

const themes: { key: ThemeMode; icon: string }[] = [
  { key: 'light', icon: '☀' },
  { key: 'sepia', icon: '☕' },
  { key: 'dark', icon: '◉' },
]

const themeBg: Record<ThemeMode, string> = {
  light: '#ece8f4',
  sepia: '#f4ecd8',
  dark: '#0a0a1a',
  custom: '#0a0a1a',
}

const glass = (dark: boolean) => ({
  background: dark ? 'rgba(15,12,41,0.45)' : 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
})

const btn = (fg: string) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer' as const,
  color: fg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
  padding: '7px 14px',
  fontSize: 13,
  fontWeight: 600 as const,
  opacity: 0.7,
  transition: 'all 0.15s ease',
})

export function Reader({
  filePath, meta, theme, progress, toc, layout, bookmarks, bookmarkCfi, highlights, selectionInfo, customTheme, onLoad, onBack, onNext, onPrev, onNavigate, currentHref, onThemeChange, onCustomThemeChange, onLayoutChange, onToggleBookmark, onNavigateCfi, onDeleteBookmark, onAddHighlight, onRemoveHighlight, onClearSelection, onSeek, onResize, aiConfig, onGetChapterText, onGetFullBookText, onSearch, onNavigateToSearchResult,
}: ReaderProps) {
  const nextRef = useRef(onNext)
  const prevRef = useRef(onPrev)
  nextRef.current = onNext
  prevRef.current = onPrev

  const loadedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!filePath) {
      loadedRef.current = false
      return
    }
    if (!loadedRef.current) {
      loadedRef.current = true
      onLoad(filePath)
    }
  }, [filePath, onLoad])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !onResize) return
    const ro = new ResizeObserver(() => onResize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [onResize])

  const [showUI, setShowUI] = useState(true)
  const [showAI, setShowAI] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showAa, setShowAa] = useState(false)
  const [showMarkers, setShowMarkers] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [markerTab, setMarkerTab] = useState<'bookmarks' | 'highlights'>('bookmarks')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showCustomTheme, setShowCustomTheme] = useState(false)
  const [localCustomTheme, setLocalCustomTheme] = useState<CustomTheme>(customTheme ?? defaultCustomTheme)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showControls = () => {
    setShowUI(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowUI(false), 3000)
  }

  useEffect(() => {
    showControls()
    return () => clearTimeout(hideTimer.current)
  }, [])

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('[data-scroll]')) return
      e.preventDefault()
      if (wheelTimer.current) return
      wheelTimer.current = setTimeout(() => { wheelTimer.current = undefined }, 200)
      if (e.deltaY > 0) nextRef.current()
      else if (e.deltaY < 0) prevRef.current()
    }
    document.addEventListener('wheel', handler, { passive: false })
    return () => {
      document.removeEventListener('wheel', handler)
      clearTimeout(wheelTimer.current)
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.code === 'MediaNextTrack' || e.key === 'MediaNextTrack') && layout.enableMediaKey !== false) {
        e.preventDefault(); nextRef.current()
      }
      if ((e.code === 'MediaPreviousTrack' || e.key === 'MediaPreviousTrack') && layout.enableMediaKey !== false) {
        e.preventDefault(); prevRef.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [layout.enableMediaKey])

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  useEffect(() => {
    setLocalCustomTheme(customTheme ?? defaultCustomTheme)
  }, [customTheme])

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    if (!onSearch) return
    setSearching(true)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      const r = await onSearch(searchQuery)
      setSearchResults(r)
      setSearching(false)
    }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [searchQuery, onSearch])

  const handleViewerClick = (e: React.MouseEvent) => {
    const iframe = document.querySelector<HTMLIFrameElement>('#viewer iframe')
    if (iframe?.contentDocument) {
      const r = iframe.getBoundingClientRect()
      const el = iframe.contentDocument.elementFromPoint(e.clientX - r.left, e.clientY - r.top)
      const link = el?.closest('a')
      if (link?.getAttribute('href')) {
        link.click()
        return
      }
    }

    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    const w = e.currentTarget.getBoundingClientRect().width
    if (x < w * 0.22) { prevRef.current(); showControls(); return }
    if (x > w * 0.78) { nextRef.current(); showControls(); return }

    setShowUI(v => !v)
    clearTimeout(hideTimer.current)
  }

  const dark = theme === 'dark'
  const fg = dark ? '#c8c8e0' : '#2d2b55'

  return (
    <div ref={containerRef} style={{ height: '100%', background: themeBg[theme], overflow: 'hidden', position: 'relative' }}>
      <div id="viewer" style={{ position: 'absolute', inset: 0 }} />
      <div
        onClick={handleViewerClick}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') { e.preventDefault(); nextRef.current() }
          if (e.key === 'ArrowLeft') { e.preventDefault(); prevRef.current() }
        }}
        tabIndex={0}
        style={{ position: 'absolute', inset: 0, zIndex: 1, outline: 'none' }}
      />

      {/* top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '12px 8px', paddingTop: '36px',
        opacity: showUI ? 1 : 0,
        pointerEvents: showUI ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        zIndex: 2,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          borderRadius: 14, padding: '8px 12px',
          ...glass(dark),
        }}>
          <button onClick={onBack} style={btn(fg)}>← 返回</button>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meta?.title || ''}
          </span>
          <button onClick={(e) => { e.stopPropagation(); setShowSidebar(v => !v) }} style={btn(fg)}>目录</button>
          <button onClick={(e) => { e.stopPropagation(); onToggleBookmark() }}
            style={{
              ...btn(fg), fontSize: 16, padding: '7px 10px',
              color: bookmarkCfi ? '#a855f7' : fg,
              opacity: bookmarkCfi ? 1 : 0.6,
            }}
          >{bookmarkCfi ? '🔖' : '🔖'}</button>
          {themes.map(t => (
            <button key={t.key} onClick={(e) => { e.stopPropagation(); onThemeChange(t.key); setShowCustomTheme(false) }}
              style={{
                ...btn(fg), padding: '7px 10px',
                background: theme === t.key ? 'rgba(99,102,241,0.3)' : 'transparent',
                opacity: 1,
                fontWeight: theme === t.key ? 700 : 400,
              }}
            >{t.icon}</button>
          ))}
          <button onClick={(e) => { e.stopPropagation(); onThemeChange('custom'); setShowCustomTheme(v => !v) }}
            style={{
              ...btn(fg), padding: '7px 10px', fontSize: 15,
              background: theme === 'custom' ? 'rgba(99,102,241,0.3)' : 'transparent',
              opacity: 1,
            }}
          >🎨</button>
          <button onClick={(e) => { e.stopPropagation(); setShowSearch(v => !v); setShowMarkers(false); setShowAa(false) }}
            style={{
              ...btn(fg), padding: '7px 10px', fontSize: 15,
              background: showSearch ? 'rgba(99,102,241,0.3)' : 'transparent',
              opacity: 1,
            }}
          >🔍</button>
          <button onClick={(e) => { e.stopPropagation(); setShowMarkers(v => !v) }} style={btn(fg)}>📑</button>
          <button onClick={(e) => { e.stopPropagation(); setShowAa(v => !v) }} style={btn(fg)}>Aa</button>
        </div>
      </div>

      {/* bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '8px',
        opacity: showUI ? 1 : 0,
        pointerEvents: showUI ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        zIndex: 2,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          borderRadius: 14, padding: '8px 12px',
          ...glass(dark),
        }}>
          <button onClick={onPrev} style={btn(fg)}>◂ 上一页</button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              onClick={e => {
                const r = e.currentTarget.getBoundingClientRect()
                onSeek(Math.round(((e.clientX - r.left) / r.width) * 100))
              }}
              style={{
                flex: 1, height: 5, borderRadius: 3,
                background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                cursor: 'pointer', overflow: 'hidden',
              }}
            >
              <div style={{
                width: `${progress}%`, height: '100%',
                background: `linear-gradient(90deg, #6366f1, #a855f7)`,
                borderRadius: 3, transition: 'width 0.2s ease',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)',
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#a855f7', boxShadow: '0 0 6px rgba(168,85,247,0.5)',
                  opacity: 0.6,
                }} />
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: fg, opacity: 0.5, minWidth: 32, textAlign: 'right' }}>{progress}%</span>
          </div>

          <button onClick={onNext} style={btn(fg)}>下一页 ▸</button>
        </div>
      </div>

      {/* AI button */}
      {!showAI && (
        <button
          onClick={() => setShowAI(true)}
          style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 5,
            border: 'none', borderRadius: 12, padding: '10px 16px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            opacity: 0.7, transition: 'all 0.15s',
            boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
          }}
        >AI</button>
      )}

      <AIPanel
        visible={showAI}
        onClose={() => setShowAI(false)}
        config={aiConfig ?? null}
        theme={theme === 'custom' ? 'dark' : theme}
        onGetChapterText={onGetChapterText ?? (async () => '')}
        onGetFullBookText={onGetFullBookText ?? (async () => '')}
      />

      <SelectionToolbar
        visible={!!selectionInfo}
        bounds={selectionInfo?.bounds ?? null}
        onSelectColor={onAddHighlight}
        onClear={onClearSelection}
      />

      {showSearch && (
        <>
          <div onClick={() => setShowSearch(false)} style={{
            position: 'fixed', inset: 0, zIndex: 9, background: 'transparent',
          }} />
          <div onClick={e => e.stopPropagation()} style={{
            position: 'fixed', top: 100, right: 16, zIndex: 10,
            width: 300,
            borderRadius: 14, padding: '12px 14px',
            ...glass(dark),
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={searchInputRef} value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') setShowSearch(false) }}
                placeholder="搜索全书..."
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  color: fg, outline: 'none',
                }}
              />
              {searching && <span style={{ fontSize: 12, color: fg, opacity: 0.5, alignSelf: 'center' }}>搜索中...</span>}
            </div>
            {searchResults.length > 0 && (
              <div style={{ fontSize: 11, color: fg, opacity: 0.4, padding: '0 4px' }}>找到 {searchResults.length} 处匹配</div>
            )}
            {searchQuery && searchResults.length === 0 && !searching && (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: fg, opacity: 0.3 }}>未找到匹配</div>
            )}
            <div data-scroll="true" style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {searchResults.map((r, idx) => (
                <div key={`${r.chapterIndex}-${r.matchIndex}`} onClick={() => onNavigateToSearchResult?.(r)}
                  style={{
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: 10, color: fg, opacity: 0.4, marginBottom: 3 }}>{r.chapterLabel}</div>
                  <div style={{ fontSize: 12, color: fg, lineHeight: 1.4 }}>
                    {r.contextBefore ? (
                      <span style={{ color: fg, opacity: 0.4 }}>...{r.contextBefore}</span>
                    ) : null}
                    <span style={{ background: 'rgba(255,213,0,0.35)', borderRadius: 2, padding: '0 1px' }}>{r.matchText}</span>
                    {r.contextAfter ? (
                      <span style={{ color: fg, opacity: 0.4 }}>{r.contextAfter}...</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showCustomTheme && (
        <>
          <div onClick={() => setShowCustomTheme(false)} style={{
            position: 'fixed', inset: 0, zIndex: 9, background: 'transparent',
          }} />
          <CustomThemePanel
            theme={localCustomTheme}
            dark={dark}
            onChange={onCustomThemeChange ?? (() => {})}
            onClose={() => setShowCustomTheme(false)}
          />
        </>
      )}

      <MarkersPanel
        visible={showMarkers}
        dark={dark}
        bookmarks={bookmarks}
        highlights={highlights}
        markerTab={markerTab}
        onTabChange={setMarkerTab}
        onNavigate={onNavigateCfi}
        onDeleteBookmark={onDeleteBookmark}
        onDeleteHighlight={onRemoveHighlight}
        onClose={() => setShowMarkers(false)}
      />

      <LayoutPanel
        visible={showAa}
        layout={layout}
        dark={dark}
        onLayoutChange={onLayoutChange}
        onClose={() => setShowAa(false)}
      />

      <Sidebar
        visible={showSidebar}
        toc={toc}
        currentHref={currentHref}
        dark={dark}
        onNavigate={onNavigate}
        onClose={() => setShowSidebar(false)}
      />
    </div>
  )
}
