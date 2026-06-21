import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { loadAllBooks, deleteBook, saveBook, saveBookData, loadWebDAVConfig, loadAIConfig, loadReadingTime, loadAllProgress, loadSetting, saveSetting, type BookRecord } from './utils/db'
import { useEpub } from './hooks/useEpub'
import { Library } from './components/Library'
import { Reader } from './components/Reader'
import type { WebDAVConfig, AIConfig, CustomBgConfig } from './types'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App as CapacitorApp } from '@capacitor/app'
import { initInstallPrompt } from './utils/mobile'

export default function App() {
  const [books, setBooks] = useState<BookRecord[]>([])
  const [readerPath, setReaderPath] = useState<string | null>(null)
  const [readerExiting, setReaderExiting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [readingTime, setReadingTime] = useState(0)
  const [webdavConfig, setWebdavConfig] = useState<WebDAVConfig | null>(null)
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null)
  const [progressRecords, setProgressRecords] = useState<{ filePath: string; progress: number; updatedAt: number }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const epub = useEpub()
  const [startupBehavior, setStartupBehavior] = useState<'library' | 'resume'>('library')

  const handleOpenBook = useCallback((filePath: string) => {
    setReaderPath(filePath)
  }, [])

  useEffect(() => {
    Promise.all([
      loadAllBooks(),
      loadWebDAVConfig(),
      loadAIConfig(),
      loadReadingTime(new Date().toISOString().slice(0, 10)),
      loadSetting('startupBehavior'),
      loadAllProgress(),
    ]).then(([bks, wc, ac, rt, behavior, progressRecords]) => {
      setBooks(bks)
      setWebdavConfig(wc)
      setAIConfig(ac)
      setReadingTime(rt)
      setProgressRecords(progressRecords)
      epub.initReadingTime(rt)
      StatusBar.setOverlaysWebView({ overlay: true })
      StatusBar.setBackgroundColor({ color: '#0a0807' })
      StatusBar.setStyle({ style: Style.Dark })
      const sb = behavior as 'library' | 'resume' | null
      if (sb === 'library' || sb === 'resume') setStartupBehavior(sb)
      if (sb === 'resume' && bks.length > 0) {
        const sorted = [...progressRecords].sort((a, b) => b.updatedAt - a.updatedAt)
        const last = sorted.find(p => bks.some(b => b.filePath === p.filePath))
        if (last) handleOpenBook(last.filePath)
      }
    }).catch(console.warn).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const data = await file.arrayBuffer()
      const filePath = 'imported:' + file.name
      await saveBookData(filePath, data)
      const meta = await epub.extractMeta(filePath, data)
      await saveBook({ filePath, title: meta.title, author: meta.author, cover: meta.cover, format: 'epub', lastOpenedAt: Date.now() })
      setBooks(await loadAllBooks())
    } catch (err) {
      console.error('[App] import failed:', err)
    }
    setLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [epub])

  const handleDelete = useCallback(async (filePath: string, _deleteFile: boolean) => {
    await deleteBook(filePath)
    setBooks(await loadAllBooks())
  }, [])

  const handleBack = useCallback(() => {
    setReaderExiting(true)
    clearTimeout(exitTimerRef.current)
    exitTimerRef.current = setTimeout(() => {
      epub.destroy()
      setReaderPath(null)
      setReaderExiting(false)
    }, 250)
  }, [epub])

  useEffect(() => {
    if (readerPath) return
    const interval = setInterval(() => {
      setReadingTime(epub.getReadingSeconds())
    }, 10000)
    return () => clearInterval(interval)
  }, [readerPath, epub])

  useEffect(() => {
    return () => clearTimeout(exitTimerRef.current)
  }, [])

  // Initialize PWA install prompt listener
  useEffect(() => {
    initInstallPrompt()
  }, [])

  const [bgGradient, setBgGradient] = useState('linear-gradient(160deg, #0a0807 0%, #13100c 50%, #1c1710 100%)')
  const [glassBg, setGlassBg] = useState('rgba(28, 23, 16, 0.72)')

  const handleBgChange = useCallback((gradient: string, gBg?: string) => {
    setBgGradient(gradient)
    if (gBg) setGlassBg(gBg)
  }, [])

  // Custom background wallpaper configuration. When set (color/gradient/image),
  // it overrides the gradient preset. Mirrors src/App.tsx in the source project.
  const [customBg, setCustomBg] = useState<CustomBgConfig | null>(null)
  useEffect(() => {
    loadSetting('customBg').then(v => {
      if (v) {
        try {
          const parsed = JSON.parse(v) as CustomBgConfig
          setCustomBg(parsed)
        } catch { /* corrupted — ignore */ }
      }
    }).catch(() => { /* ignore */ })
  }, [])
  const handleCustomBgChange = useCallback((config: CustomBgConfig) => {
    setCustomBg(config)
    saveSetting('customBg', JSON.stringify(config)).catch(e => console.warn('[App] saveSetting customBg failed', e))
  }, [])

  // Resolve the home-page background: custom wallpaper takes precedence over the
  // preset gradient. When the user is on the library page, customBg styles are
  // applied to the outer div; preset gradients apply to the #root so the safe-area
  // padding area blends seamlessly.
  const appBg = useMemo(() => {
    if (customBg && customBg.type === 'color' && customBg.color) {
      return customBg.color
    }
    if (customBg && customBg.type === 'image' && customBg.imageData) {
      return `url(${customBg.imageData}) center/cover no-repeat`
    }
    if (customBg && customBg.type === 'gradient' && customBg.gradient) {
      const g = customBg.gradient
      if (g.type === 'solid' && g.color) return g.color
      if (g.type === 'gradient' && g.gradientStops?.length) {
        const stops = g.gradientStops.map(s => `${s.color} ${s.position}%`).join(', ')
        if (g.gradientType === 'radial') {
          return `radial-gradient(ellipse at center, ${stops})`
        }
        return `linear-gradient(${g.gradientAngle ?? 135}deg, ${stops})`
      }
    }
    return bgGradient
  }, [customBg, bgGradient])

  // sync background to #root so padding area blends seamlessly with content.
  // When a custom wallpaper is in effect, the inner div handles the background
  // so we leave #root transparent for image wallpapers.
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (readerPath) {
      root.style.background = ''
      return
    }
    const useRoot = !customBg || customBg.type === 'preset'
    root.style.background = useRoot ? bgGradient : ''
  }, [bgGradient, readerPath, customBg])

  // Derive glass tint from customBg when not using a preset
  const effectiveGlassBg = useMemo(() => {
    if (!customBg || customBg.type === 'preset') return glassBg
    if (customBg.type === 'color' && customBg.color) {
      // Parse color and reduce opacity to create a glass tint
      const c = customBg.color
      if (c.startsWith('#')) {
        const r = parseInt(c.slice(1, 3), 16)
        const g = parseInt(c.slice(3, 5), 16)
        const b = parseInt(c.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, 0.72)`
      }
      return c
    }
    if (customBg.type === 'gradient' && customBg.gradient?.gradientStops?.length) {
      // Use the first stop color as glass base
      const first = customBg.gradient.gradientStops[0].color
      if (first.startsWith('#')) {
        const r = parseInt(first.slice(1, 3), 16)
        const g = parseInt(first.slice(3, 5), 16)
        const b = parseInt(first.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, 0.72)`
      }
    }
    return glassBg
  }, [customBg, glassBg])

  // Push glass tint to CSS variable so .cr-glass and inline glass() calls can use it
  useEffect(() => {
    document.documentElement.style.setProperty('--cr-glass-bg', effectiveGlassBg)
  }, [effectiveGlassBg])

  // Double-back-to-exit logic
  const lastBackPressRef = useRef(0)
  const [exitToast, setExitToast] = useState(false)
  const exitToastTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handler = CapacitorApp.addListener('backButton', () => {
      if (readerPath) {
        handleBack()
      } else {
        const now = Date.now()
        if (now - lastBackPressRef.current < 2000) {
          CapacitorApp.exitApp()
        } else {
          lastBackPressRef.current = now
          setExitToast(true)
          clearTimeout(exitToastTimerRef.current)
          exitToastTimerRef.current = setTimeout(() => setExitToast(false), 2000)
        }
      }
    })
    return () => {
      handler.remove()
      clearTimeout(exitToastTimerRef.current)
    }
  }, [readerPath, handleBack])

  if (readerPath) {
    return (
        <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        opacity: readerExiting ? 0 : 1,
        transform: readerExiting ? 'translateY(24px)' : 'translateY(0)',
        pointerEvents: readerExiting ? 'none' : 'auto',
      }}>
        <Reader
          filePath={readerPath}
          meta={epub.meta}
          theme={epub.theme}
          progress={epub.progress}
          toc={epub.toc}
          onLoad={epub.openBook}
          onBack={handleBack}
          onNext={epub.goNext}
          onPrev={epub.goPrev}
          onNavigate={epub.goToHref}
          currentHref={epub.sectionHref}
          layout={epub.layout}
          onLayoutChange={epub.updateLayout}
          bookmarks={epub.bookmarks}
          bookmarkCfi={epub.bookmarkCfi}
          highlights={epub.highlights}
          selectionInfo={epub.selectionInfo}
          onToggleBookmark={epub.toggleBookmark}
          onNavigateCfi={epub.goToCfi}
          onDeleteBookmark={epub.removeBookmarkById}
          onAddHighlight={epub.addHighlight}
          onRemoveHighlight={epub.removeHighlight}
          onClearSelection={epub.clearSelection}
          onThemeChange={epub.setTheme}
          onSeek={epub.seekTo}
          onResize={epub.resizeViewer}
          aiConfig={aiConfig}
          onGetChapterText={epub.getChapterText}
          onGetFullBookText={epub.getFullBookText}
          onSearch={epub.searchText}
          onNavigateToSearchResult={epub.navigateToSearchResult}
          customTheme={epub.customTheme}
          onCustomThemeChange={epub.setCustomTheme}
        />
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      background: appBg,
      transition: 'background 0.3s ease',
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,.epub3"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <Library
        books={books}
        readingTime={readingTime}
        progressRecords={progressRecords}
        onOpenBook={handleOpenBook}
        onImport={() => fileInputRef.current?.click()}
        onDelete={handleDelete}
        onBgChange={handleBgChange}
        customBg={customBg}
        onCustomBgChange={handleCustomBgChange}
        webdavConfig={webdavConfig}
        onWebDAVConfigChange={setWebdavConfig}
        aiConfig={aiConfig}
        onAIConfigChange={setAIConfig}
        startupBehavior={startupBehavior}
        onStartupBehaviorChange={setStartupBehavior}
      />
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, color: '#fff', fontSize: 14 }}>
          加载中...
        </div>
      )}
      {exitToast && (
        <div style={{
          position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom, 12px))', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)', color: '#fff', padding: '10px 24px', borderRadius: 8,
          fontSize: 14, fontFamily: 'system-ui, sans-serif', zIndex: 1000,
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          animation: 'fadeInUp 0.2s ease',
        }}>
          再按一次退出应用
        </div>
      )}
    </div>
  )
}
