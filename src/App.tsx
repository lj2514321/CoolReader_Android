import { useState, useEffect, useRef, useCallback } from 'react'
import { loadAllBooks, deleteBook, saveBook, saveBookData, loadWebDAVConfig, loadAIConfig, loadReadingTime, loadAllProgress, loadSetting, type BookRecord } from './utils/db'
import { useEpub } from './hooks/useEpub'
import { Library } from './components/Library'
import { Reader } from './components/Reader'
import type { WebDAVConfig, AIConfig } from './types'

export default function App() {
  const [books, setBooks] = useState<BookRecord[]>([])
  const [readerPath, setReaderPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [readingTime, setReadingTime] = useState(0)
  const [webdavConfig, setWebdavConfig] = useState<WebDAVConfig | null>(null)
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null)
  const [progressRecords, setProgressRecords] = useState<{ filePath: string; progress: number; updatedAt: number }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      const sb = behavior as 'library' | 'resume' | null
      if (sb === 'library' || sb === 'resume') setStartupBehavior(sb)
      if (sb === 'resume' && bks.length > 0) {
        const sorted = [...progressRecords].sort((a, b) => b.updatedAt - a.updatedAt)
        const last = sorted.find(p => bks.some(b => b.filePath === p.filePath))
        if (last) handleOpenBook(last.filePath)
      }
    }).catch(console.warn).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epub])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const data = await file.arrayBuffer()
      const filePath = 'imported:' + file.name
      await saveBookData(filePath, data)
      const meta = await epub.extractMeta(filePath, data)
      await saveBook({ filePath, title: meta.title, author: meta.author, cover: meta.cover })
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
    epub.destroy()
    setReaderPath(null)
  }, [epub])

  useEffect(() => {
    if (readerPath) return
    const interval = setInterval(() => {
      setReadingTime(epub.getReadingSeconds())
    }, 10000)
    return () => clearInterval(interval)
  }, [readerPath, epub])

  const [bgGradient, setBgGradient] = useState('linear-gradient(135deg, #0f0c29, #302b63, #24243e)')

  if (readerPath) {
    return (
      <div style={{ height: '100%', background: bgGradient }}>
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
    <div style={{ height: '100%', background: bgGradient }}>
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
        onBgChange={setBgGradient}
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
    </div>
  )
}
