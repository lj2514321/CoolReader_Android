import { useEffect, useRef, useState } from 'react'
import { BookMeta, ThemeMode, AIConfig, NavItem, ReaderLayout, Bookmark, Highlight, SearchResult, CustomTheme, defaultCustomTheme } from '../types'
import useSwipe from '../hooks/useSwipe'
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
  light: '#f4ead5',     /* 暖纸白 */
  sepia: '#f0e8d0',    /* 暖黄 */
  dark: '#0a0807',      /* 暖黑 */
  custom: '#0a0807',
}

const AMBER = '#d4923a'
const AMBER_DIM = 'rgba(212,146,58,0.15)'
const AMBER_GLOW = 'rgba(212,146,58,0.35)'
const BORDER = 'rgba(240,235,226,0.10)'

/** 阅读主题对应的基础色 */
const themeBase: Record<string, [number, number, number]> = {
  dark:   [10, 8, 7],
  sepia:  [240, 232, 208],
  light:  [244, 234, 213],
  custom: [10, 8, 7],
}
const getThemeRgb = (t: string) => themeBase[t] ?? themeBase.dark

/** 玻璃背景色跟随阅读主题 */
const glassForTheme = (theme: string) => {
  const [r, g, b] = getThemeRgb(theme)
  const isLight = theme === 'light' || theme === 'sepia'
  return {
    background: `rgba(${r}, ${g}, ${b}, ${isLight ? 0.85 : 0.92})`,
    backdropFilter: 'blur(20px) saturate(140%)',
    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  }
}

/** 底栏 / 弹出面板（更高不透明度） */
const panelBg = (theme: string) => {
  const [r, g, b] = getThemeRgb(theme)
  const isLight = theme === 'light' || theme === 'sepia'
  return `rgba(${r}, ${g}, ${b}, ${isLight ? 0.90 : 0.94})`
}

const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"
const fontBody = "system-ui, -apple-system, 'Segoe UI', sans-serif"

const btn = (fg: string) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer' as const,
  color: fg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 2,
  padding: '7px 14px',
  fontSize: 13,
  fontFamily: fontDisplay,
  fontWeight: 600 as const,
  transition: 'all 0.15s ease',
})

export function Reader({
  filePath, meta, theme, progress, toc, layout, bookmarks, bookmarkCfi, highlights, selectionInfo, customTheme, onLoad, onBack, onNext, onPrev, onNavigate, currentHref, onThemeChange, onCustomThemeChange, onLayoutChange, onToggleBookmark, onNavigateCfi, onDeleteBookmark, onAddHighlight, onRemoveHighlight, onClearSelection, onSeek, onResize, aiConfig, onGetChapterText, onGetFullBookText, onSearch, onNavigateToSearchResult,
}: ReaderProps) {
  const nextRef = useRef(onNext)
  const prevRef = useRef(onPrev)
  const isSwipingRef = useRef(false)
  const touchStartPosRef = useRef({ x: 0, y: 0 })
  nextRef.current = onNext
  prevRef.current = onPrev

  const swipeHandlers = useSwipe({
    threshold: 50,
    onSwipeLeft: () => { nextRef.current() },
    onSwipeRight: () => { prevRef.current() },
    enabled: layout.flow !== 'scrolled-doc',
  })

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
  const [showToolsPopup, setShowToolsPopup] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [showBrightness, setShowBrightness] = useState(false)
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
    if (isSwipingRef.current) {
      isSwipingRef.current = false
      return
    }
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
    if (x < w * 0.22) { prevRef.current(); return }
    if (x > w * 0.78) { nextRef.current(); return }

    setShowUI(v => !v)
    clearTimeout(hideTimer.current)
  }

  const dark = theme === 'dark' || theme === 'custom'
  const fg = dark ? '#f0ebe2' : '#3d2b1a'

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 100, background: themeBg[theme], overflow: 'hidden' }}>
      <div id="viewer" style={{ position: 'absolute', inset: 0, filter: `brightness(${brightness / 100})`, transition: 'filter 0.2s', paddingTop: 'max(env(safe-area-inset-top), 48px)', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }} />
      <div
        onClick={handleViewerClick}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') { e.preventDefault(); nextRef.current() }
          if (e.key === 'ArrowLeft') { e.preventDefault(); prevRef.current() }
        }}
        onTouchStart={(e) => {
          touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
          isSwipingRef.current = false
          swipeHandlers.onTouchStart(e)
        }}
        onTouchMove={(e) => {
          swipeHandlers.onTouchMove(e)
        }}
        onTouchEnd={(e) => {
          const dx = Math.abs(e.changedTouches[0].clientX - touchStartPosRef.current.x)
          const dy = Math.abs(e.changedTouches[0].clientY - touchStartPosRef.current.y)
          if (dx > 10 || dy > 10) {
            isSwipingRef.current = true
          }
          swipeHandlers.onTouchEnd(e)
        }}
        tabIndex={0}
        style={{ position: 'absolute', inset: 0, zIndex: 1, outline: 'none', touchAction: 'none' }}
      />

      {/* top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '12px 8px',
        paddingTop: 'calc(12px + max(env(safe-area-inset-top), 48px))',
        opacity: showUI ? 1 : 0,
        pointerEvents: showUI ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        zIndex: 2,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          borderRadius: 2, padding: '8px 12px',
          ...glassForTheme(theme),
        }}>
          <button onClick={onBack} style={btn(fg)}>← 返回</button>
          <span style={{ flex: 1, fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, color: fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
            {meta?.title || ''}
          </span>
        </div>
      </div>

      {/* bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '6px 8px',
        paddingBottom: 'calc(8px + max(env(safe-area-inset-bottom), 24px))',
        background: panelBg(theme),
        border: `1px solid ${dark ? BORDER : 'rgba(212,146,58,0.20)'}`,
        borderRadius: 2,
        opacity: showUI ? 1 : 0,
        pointerEvents: showUI ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        zIndex: 2,
      }}>
        {/* Row 1: prev, progress, next */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 6px',
        }}>
          <button onClick={onPrev} style={{...btn(fg), minWidth: 44, minHeight: 44}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              onClick={e => {
                const r = e.currentTarget.getBoundingClientRect()
                onSeek(Math.round(((e.clientX - r.left) / r.width) * 100))
              }}
              style={{
                flex: 1, height: 5, borderRadius: 3,
                background: dark ? 'rgba(240,235,226,0.08)' : 'rgba(0,0,0,0.06)',
                cursor: 'pointer', overflow: 'hidden',
              }}
            >
              <div style={{
                width: `${progress}%`, height: '100%',
                background: `linear-gradient(90deg, ${AMBER}, rgba(180,110,40,0.8))`,
                borderRadius: 3, transition: 'width 0.2s ease',
                position: 'relative',
              }}>
                {/* Amber dot */}
                <div style={{
                  position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)',
                  width: 9, height: 9, borderRadius: '50%',
                  background: AMBER, boxShadow: `0 0 8px ${AMBER_GLOW}`,
                }} />
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: dark ? AMBER : '#8a6a30', fontFamily: fontDisplay, minWidth: 32, textAlign: 'right' }}>{progress}%</span>
          </div>

          <button onClick={onNext} style={{...btn(fg), minWidth: 44, minHeight: 44}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Row 2: tools */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6,
          marginTop: 2,
          padding: '6px 4px',
        }}>
          {/* Amber bookmark icon — the visual signature of Direction A */}
          <button onClick={() => setShowSidebar(v => !v)} style={{
            ...btn(fg),
            background: dark ? AMBER_DIM : 'rgba(212,146,58,0.08)',
            border: `1px solid ${dark ? 'rgba(212,146,58,0.25)' : 'rgba(212,146,58,0.20)'}`,
            borderRadius: 2,
            padding: '7px 14px',
          }}>
            {/* Bookmark SVG */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill={AMBER} stroke="none" style={{ marginRight: 5 }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>目录</span>
          </button>

          <button onClick={() => setShowAa(v => !v)} style={btn(fg)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" style={{ marginRight: 5 }}>
              <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Aa</span>
          </button>

          <button onClick={() => setShowMarkers(v => !v)} style={btn(fg)}>
            {/* Highlighter SVG */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>笔记</span>
          </button>

          <button onClick={() => setShowToolsPopup(v => !v)} style={btn(fg)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>工具</span>
          </button>
        </div>

        {/* Tools Popup */}
        {showToolsPopup && (
          <>
            <div onClick={() => setShowToolsPopup(false)} style={{
              position: 'fixed', inset: 0, zIndex: 9, background: 'transparent',
            }} />
            <div style={{
              position: 'absolute', bottom: 'calc(64px + max(env(safe-area-inset-bottom), 24px))', right: 16,
              zIndex: 10,
              borderRadius: 2, padding: '8px',
              background: panelBg(theme),
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${dark ? BORDER : 'rgba(212,146,58,0.25)'}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <button
                onClick={() => { setShowSearch(true); setShowToolsPopup(false) }}
                style={{
                  ...btn(fg), justifyContent: 'flex-start', gap: 8, padding: '10px 14px',
                  borderRadius: 2,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600 }}>搜索</span>
              </button>
              <button
                onClick={() => { setShowAI(true); setShowToolsPopup(false) }}
                style={{
                  ...btn(fg), justifyContent: 'flex-start', gap: 8, padding: '10px 14px',
                  borderRadius: 2,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600 }}>AI 助手</span>
              </button>
            </div>
          </>
        )}
      </div>

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
        theme={theme}
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
            position: 'fixed', top: 'max(80px, 10vh)', right: 16, zIndex: 10,
            maxWidth: 'min(90vw, 400px)',
            borderRadius: 2, padding: '12px 14px',
            background: panelBg(theme),
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            border: `1px solid ${dark ? 'rgba(240,235,226,0.10)' : 'rgba(212,146,58,0.20)'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={searchInputRef} value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') setShowSearch(false) }}
                placeholder="搜索全书..."
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 2, fontSize: 13,
                  fontFamily: fontDisplay,
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

      {showBrightness && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom, 12px))', left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          background: 'rgba(0,0,0,0.85)',
          borderRadius: 24, padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200, alignItems: 'center',
        }}>
          <div style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>亮度</div>
          <input
            type="range"
            min="20"
            max="200"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            style={{ width: 140, accentColor: '#d4923a' }}
          />
          <div style={{ color: dark ? '#d4923a' : '#8a6030', fontSize: 11, textAlign: 'center', fontFamily: 'monospace' }}>
            {brightness}%
          </div>
        </div>
      )}

      {showCustomTheme && (
        <>
          <div onClick={() => setShowCustomTheme(false)} style={{
            position: 'fixed', inset: 0, zIndex: 9, background: 'transparent',
          }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 20, paddingTop: 'env(safe-area-inset-top)' }}>
            <CustomThemePanel
              theme={localCustomTheme}
              dark={dark}
              onChange={onCustomThemeChange ?? (() => {})}
              onClose={() => setShowCustomTheme(false)}
            />
          </div>
        </>
      )}

      <MarkersPanel
        visible={showMarkers}
        theme={theme}
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
        theme={theme}
        brightness={brightness}
        onLayoutChange={onLayoutChange}
        onThemeChange={onThemeChange}
        onBrightnessChange={setBrightness}
        onClose={() => setShowAa(false)}
      />

      <Sidebar
        visible={showSidebar}
        toc={toc}
        currentHref={currentHref}
        theme={theme}
        onNavigate={onNavigate}
        onClose={() => setShowSidebar(false)}
      />
    </div>
  )
}
