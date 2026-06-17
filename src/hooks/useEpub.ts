import { useState, useCallback, useRef, useEffect } from 'react'
import ePub, { Book, Rendition } from 'epubjs'
import { BookMeta, NavItem, ThemeMode, themeStyles, ReaderLayout, defaultLayout, Bookmark, Highlight, highlightColors, CustomTheme, defaultCustomTheme, BookFormat } from '../types'
import { generateCustomThemeCSS } from '../utils/customTheme'
import { applyPageAnimation } from '../utils/animation'
import { loadProgress, saveProgress, loadReadingTime, loadSetting, saveSetting, saveReadingTime as persistReadingTimeToDB, saveBookReadingTime as persistBookReadingTime, loadBookReadingTime as loadBookReadingTimeFromDB, loadBookData, saveBookmark, removeBookmark, loadBookmarks as loadBookmarksFromDB, saveHighlight, removeHighlight as removeHighlightFromDB, loadHighlights as loadHighlightsFromDB, updateLastOpenedAt } from '../utils/db'
import { getFormatFromPath } from '../utils/formatDetection'
import { useSearch } from './useSearch'

export function useEpub() {
  const [meta, setMeta] = useState<BookMeta | null>(null)
  const [toc, setToc] = useState<NavItem[]>([])
  const [theme, setThemeState] = useState<ThemeMode>('light')
  const [progress, setProgress] = useState(0)
  const [sectionHref, setSectionHref] = useState('')
  const [layout, setLayoutState] = useState<ReaderLayout>(defaultLayout)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarkCfi, setBookmarkCfi] = useState<string>('')
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [selectionInfo, setSelectionInfo] = useState<{ text: string; cfiRange: string; bounds: { top: number; left: number; width: number; height: number } } | null>(null)
  const [customTheme, setCustomThemeState] = useState<CustomTheme>(defaultCustomTheme)
  const customThemeRef = useRef<CustomTheme>(defaultCustomTheme)
  const bookmarksRef = useRef<Bookmark[]>([])
  const progressRef = useRef(0)
  const cfiRef = useRef('')
  const indexRef = useRef(0)
  const sectionHrefRef = useRef('')
  const syncRef = useRef<() => void>(() => {})
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const layoutRef = useRef<ReaderLayout>(defaultLayout)
  const themeRef = useRef<ThemeMode>('light')
  const totalSectionsRef = useRef(0)
  const sessionStartRef = useRef(0)
  const todaySecondsRef = useRef(0)
  const bookTodayRef = useRef(0)
  const bookSessionStartRef = useRef(0)
  const bookPathRef = useRef('')
  const currentFilePathRef = useRef('')

  const search = useSearch()

  const readFile = useCallback(async (filePath: string): Promise<ArrayBuffer> => {
    const data = await loadBookData(filePath)
    if (!data) throw new Error('Book data not found in IndexedDB: ' + filePath)
    return data
  }, [])

  const extractMeta = useCallback(async (filePath: string, data?: ArrayBuffer): Promise<BookMeta> => {
    // Source v1.5.3: dispatch by format. Mobile target only opens epub, but
    // detecting the format keeps the type contract aligned with future adapters.
    const format: BookFormat = (() => {
      try { return getFormatFromPath(filePath) } catch { return 'epub' }
    })()

    // TXT/MOBI on mobile: extractMeta is a filename-based fallback. Adapters
    // would render real chapter content; the mobile target does not support
    // those formats yet, so the metadata is best-effort.
    if (format === 'txt') {
      const base = filePath.split(/[\\/]/).pop()?.replace(/\.txt$/i, '') || 'Untitled'
      return { title: base, author: 'Unknown' }
    }
    if (format === 'mobi') {
      const base = filePath.split(/[\\/]/).pop()?.replace(/\.(mobi|azw3|prc)$/i, '') || 'Untitled'
      return { title: base, author: 'Unknown' }
    }

    if (!data) {
      data = await readFile(filePath)
    }
    const book = ePub(data)
    await book.ready
    const meta = book.packaging?.metadata
    const title = meta?.title || 'Untitled'
    const creator = meta?.creator || 'Unknown'
    let cover: string | undefined
    try {
      const coverUrl = await book.coverUrl()
      if (coverUrl) {
        const resp = await fetch(coverUrl)
        const blob = await resp.blob()
        cover = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
      }
    } catch { console.warn('[extractMeta] cover fetch failed') }
    book.destroy()
    return { title, author: creator, cover }
  }, [readFile])

  const openBook = useCallback(async (filePath: string) => {
    if (bookRef.current) {
      renditionRef.current?.destroy()
      bookRef.current.destroy()
    }

    setMeta(null)
    setToc([])
    setProgress(0)
    progressRef.current = 0
    cfiRef.current = ''
    indexRef.current = 0
    sectionHrefRef.current = ''

    const data = await readFile(filePath)
    const book = ePub(data)
    bookRef.current = book
    currentFilePathRef.current = filePath
    bookPathRef.current = filePath
    // Source v1.5.x: track last-opened timestamp so the resume-on-startup
    // behavior can pick the most recently read book. Fire-and-forget so we
    // don't block book opening on this metadata write.
    updateLastOpenedAt(filePath).catch(e => console.warn('[openBook] updateLastOpenedAt failed', e))
    await book.ready

    const today = new Date().toISOString().slice(0, 10)
    todaySecondsRef.current = await loadReadingTime(today)
    sessionStartRef.current = Date.now()
    bookTodayRef.current = await loadBookReadingTimeFromDB(filePath, today)
    bookSessionStartRef.current = Date.now()

    const { title, creator } = book.packaging.metadata
    let cover: string | undefined
    const coverUrl = await book.coverUrl()
    if (coverUrl) cover = coverUrl

    setMeta({
      title: title || 'Untitled',
      author: creator || 'Unknown',
      cover,
    })

    const nav = await book.loaded.navigation
    function mapToc(items: any[]): NavItem[] {
      return items.map((item: any) => ({
        label: item.label,
        href: item.href,
        subitems: item.subitems ? mapToc(item.subitems) : undefined,
      }))
    }
    setToc(mapToc(nav.toc))

    const rendition = book.renderTo('viewer', {
      width: '100%',
      height: '100%',
      spread: 'none',
    })
    renditionRef.current = rendition

    const spine = book.spine
    const count = spine.length || spine.items?.length || 0
    totalSectionsRef.current = count

    const sync = () => {
      const cur = rendition.currentLocation()
      if (!cur?.start) return
      const idx = Number(cur.start.index) || 0
      const pct = count > 0 ? Math.round((idx / count) * 100) : 0
      progressRef.current = pct
      const cfi = cur.start.cfi || ''
      cfiRef.current = cfi
      indexRef.current = idx
      const spineItems = book.spine.items
      const href = spineItems?.[idx]?.href || ''
      sectionHrefRef.current = href
      setSectionHref(href)
      setProgress(pct)
      setBookmarkCfi(bookmarksRef.current.some(b => b.cfi === cfi) ? cfi : '')
      // 持久化阅读进度 — pass cfi as both cfi and location (source v1.5.x format).
      // chapterLabel is left empty here; resumed labels come from loadProgress on next open.
      saveProgress(currentFilePathRef.current, pct, cfi, idx, undefined, cfi).catch(e => console.warn('[sync] saveProgress failed', e))
    }

    const onRelocated = () => requestAnimationFrame(() => { sync(); applyLayout() })
    syncRef.current = sync
    search.register(bookRef.current, rendition, toc, indexRef.current, sync)

    let saved: { progress: number; cfi: string; index: number } | null = null
    let savedTheme: string | null = null
    let savedLayout: string | null = null
    let savedCustomTheme: string | null = null
    try {
      const r = await Promise.all([loadProgress(filePath), loadSetting('readerTheme'), loadSetting('readerLayout'), loadSetting('customTheme')])
      saved = r[0]
      savedTheme = r[1]
      savedLayout = r[2]
      savedCustomTheme = r[3]
    } catch (e) { console.warn('[openBook] load saved failed', e) }

    if (savedCustomTheme) {
      try {
        const ct = JSON.parse(savedCustomTheme) as CustomTheme
        customThemeRef.current = ct
        setCustomThemeState(ct)
      } catch (e) { console.warn('[openBook] custom theme parse failed', e) }
    }

    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout) as ReaderLayout
        layoutRef.current = parsed
        setLayoutState(parsed)
      } catch (e) { console.warn('[openBook] layout parse failed', e) }
    }

    if (savedTheme && ['light', 'dark', 'sepia', 'custom'].includes(savedTheme)) {
      themeRef.current = savedTheme as ThemeMode
      setThemeState(savedTheme as ThemeMode)
    }
    const t = themeRef.current

    ;['light', 'sepia', 'dark', 'custom'].forEach(th => rendition.themes.registerCss(th, themeStyles[th]))
    if (t === 'custom') {
      try {
        rendition.themes.registerCss('custom', generateCustomThemeCSS(customThemeRef.current))
      } catch (e) { console.warn('[openBook] custom CSS registration failed', e) }
    }
    rendition.themes.select(t)

    rendition.on('content', () => {
      const iframe = document.querySelector<HTMLIFrameElement>('#viewer iframe')
      const doc = iframe?.contentDocument
      if (!doc || doc.getElementById('_reader_sel')) return
      const script = doc.createElement('script')
      script.id = '_reader_sel'
      script.textContent = `document.addEventListener('mouseup',function(){var s=window.getSelection();if(s&&!s.isCollapsed){var t=s.toString().trim();if(t.length>0){var r=s.getRangeAt(0).getBoundingClientRect();window.parent.postMessage({type:'reader-text-selected',text:t.slice(0,200),bounds:{top:r.top,left:r.left,width:r.width,height:r.height}},'*')}}})`
      doc.head.appendChild(script)
    })

    rendition.on('relocated', onRelocated)

    if (saved) {
      if (saved.cfi) {
        try {
          await rendition.display(saved.cfi)
        } catch {
          console.warn('[openBook] CFI restore failed, fallback to index:', saved.index)
          if (saved.index >= 0 && saved.index < count) {
            await rendition.display(saved.index)
          } else {
            await rendition.display()
          }
        }
      } else if (saved.index >= 0 && saved.index < count) {
        await rendition.display(saved.index)
      } else {
        await rendition.display()
      }
    } else {
      await rendition.display()
    }

    requestAnimationFrame(() => { sync(); applyLayout() })
    loadBookmarksForBook(filePath)
    loadHighlightsFromDB(filePath).then(records => {
      setHighlights(records)
      records.forEach(hl => {
        try {
          renditionRef.current?.annotations?.highlight(hl.cfiRange, {}, () => {}, 'epub-highlight', { fill: hl.color, 'fill-opacity': '0.3' })
        } catch (e) { console.warn('[openBook] restore highlight failed', e) }
      })
    })
  }, [readFile])

  const seekTo = useCallback((pct: number) => {
    const rendition = renditionRef.current
    const count = totalSectionsRef.current
    if (!rendition || count === 0) return
    const idx = Math.max(0, Math.min(count - 1, Math.floor(pct / 100 * count)))
    rendition.display(idx)
  }, [])

  const setTheme = useCallback((t: ThemeMode) => {
    themeRef.current = t
    setThemeState(t)
    saveSetting('readerTheme', t)
    try {
      if (t === 'custom') {
        renditionRef.current?.themes.registerCss('custom', generateCustomThemeCSS(customThemeRef.current))
      }
      renditionRef.current?.themes.select(t)
    } catch (e) {
      console.error('[setTheme] failed:', e)
    }
  }, [])

  const setCustomTheme = useCallback((ct: CustomTheme) => {
    customThemeRef.current = ct
    setCustomThemeState(ct)
    saveSetting('customTheme', JSON.stringify(ct))
    try {
      renditionRef.current?.themes.registerCss('custom', generateCustomThemeCSS(ct))
      if (themeRef.current === 'custom') {
        renditionRef.current?.themes.select('custom')
      }
    } catch (e) {
      console.error('[setCustomTheme] failed:', e)
    }
  }, [])

  const goNext = useCallback(async () => {
    await renditionRef.current?.next()
    const animMode = layoutRef.current.animationMode || 'slide'
    const reducedMotion = layoutRef.current.reducedMotion || false
    applyPageAnimation(renditionRef.current, 'next', animMode, reducedMotion, () => {
      requestAnimationFrame(syncRef.current)
    })
  }, [])
  const goPrev = useCallback(async () => {
    await renditionRef.current?.prev()
    const animMode = layoutRef.current.animationMode || 'slide'
    const reducedMotion = layoutRef.current.reducedMotion || false
    applyPageAnimation(renditionRef.current, 'prev', animMode, reducedMotion, () => {
      requestAnimationFrame(syncRef.current)
    })
  }, [])
  const goToHref = useCallback((href: string) => renditionRef.current?.display(href), [])

  const goToCfi = useCallback(async (cfi: string) => {
    try {
      await Promise.race([
        renditionRef.current?.display(cfi),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        ),
      ])
      requestAnimationFrame(syncRef.current)
    } catch {
      console.warn('[goToCfi] timeout or failed, cfi:', cfi)
    }
    try { renditionRef.current?.resize() } catch {}
  }, [])

  const getReadingSeconds = useCallback(() => {
    if (sessionStartRef.current === 0) return todaySecondsRef.current
    return todaySecondsRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000)
  }, [])

  const getBookReadingSeconds = useCallback(() => {
    if (bookSessionStartRef.current === 0) return bookTodayRef.current
    return bookTodayRef.current + Math.floor((Date.now() - bookSessionStartRef.current) / 1000)
  }, [])

  const initReadingTime = useCallback((seconds: number) => {
    todaySecondsRef.current = seconds
  }, [])

  const saveReadingTime = useCallback(async () => {
    const d = new Date().toISOString().slice(0, 10)
    await persistReadingTimeToDB(d, getReadingSeconds())
  }, [getReadingSeconds])

  const saveBookReadingTimeFn = useCallback(async () => {
    const fp = bookPathRef.current
    if (!fp) return
    const d = new Date().toISOString().slice(0, 10)
    await persistBookReadingTime(fp, d, getBookReadingSeconds())
  }, [getBookReadingSeconds])

  const resizeViewer = useCallback(() => {
    try {
      const container = document.querySelector<HTMLElement>('#viewer')
      if (container) {
        renditionRef.current?.resize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight)
      }
    } catch (e) {
      console.warn('[resizeViewer] failed:', e)
    }
  }, [])

  const getChapterText = useCallback(async (): Promise<string> => {
    const book = bookRef.current
    const idx = indexRef.current
    if (!book) return ''
    try {
      const spine = book.spine
      const item = spine.get(idx)
      if (!item?.href) return ''
      const html = await book.archive.getText(item.url)
      const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      return text.slice(0, 4000)
    } catch {
      return ''
    }
  }, [])

  const getFullBookText = useCallback(async (): Promise<string> => {
    const book = bookRef.current
    if (!book) return ''
    try {
      const items = book.spine.items || []
      let allText = ''
      for (const item of items) {
        if (!item.href) continue
        try {
          const html = await book.archive.getText(item.url)
          const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
          allText += text + '\n'
          if (allText.length > 8000) break
        } catch {
          console.warn('[getFullBookText] failed to load:', item.href)
        }
      }
      return allText.slice(0, 8000)
    } catch {
      return ''
    }
  }, [])

  useEffect(() => { bookmarksRef.current = bookmarks }, [bookmarks])

  const removeBookmarkById = useCallback(async (id: number) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.id !== id)
      bookmarksRef.current = next
      const cfi = cfiRef.current
      setBookmarkCfi(cfi && next.some(b => b.cfi === cfi) ? cfi : '')
      return next
    })
    await removeBookmark(id)
  }, [])

  const toggleBookmark = useCallback(async () => {
    const cfi = cfiRef.current
    if (!cfi || !bookRef.current) return
    const existing = bookmarksRef.current.find(b => b.cfi === cfi)
    if (existing && existing.id) {
      await removeBookmark(existing.id)
      setBookmarks(prev => prev.filter(b => b.id !== existing.id))
      setBookmarkCfi('')
    } else {
      const bm: Bookmark = { filePath: currentFilePathRef.current, cfi, label: '', createdAt: Date.now() }
      await saveBookmark(bm)
      setBookmarks(prev => [...prev, { ...bm, id: Date.now() }])
      setBookmarkCfi(cfi)
    }
  }, [])

  const loadBookmarksForBook = useCallback(async (filePath: string) => {
    const records = await loadBookmarksFromDB(filePath)
    setBookmarks(records)
    bookmarksRef.current = records
    const cur = cfiRef.current
    setBookmarkCfi(cur && records.some(b => b.cfi === cur) ? cur : '')
  }, [])

  const addHighlight = useCallback(async (color: string) => {
    const info = selectionInfo
    if (!info) return
    const fp = currentFilePathRef.current || ''
    if (!fp) return
    const note = prompt('输入笔记（可选）：') || undefined
    const hl: Highlight = { filePath: fp, cfiRange: info.cfiRange, text: info.text, color, note, createdAt: Date.now() }
    await saveHighlight(hl)
    setHighlights(prev => [...prev, { ...hl, id: Date.now() }])
    try {
      renditionRef.current?.annotations?.highlight(info.cfiRange, {}, () => {}, 'epub-highlight', { fill: color, 'fill-opacity': '0.3' })
    } catch (e) { console.warn('[addHighlight] failed', e) }
    setSelectionInfo(null)
  }, [selectionInfo])

  const removeHighlight = useCallback(async (id: number, cfiRange: string) => {
    await removeHighlightFromDB(id)
    setHighlights(prev => prev.filter(h => h.id !== id))
    try {
      renditionRef.current?.annotations?.remove(cfiRange, 'highlight')
    } catch (e) { console.warn('[removeHighlight] failed', e) }
  }, [])

  const clearSelection = useCallback(() => setSelectionInfo(null), [])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'reader-text-selected') {
        setTimeout(() => {
          const iframe = document.querySelector<HTMLIFrameElement>('#viewer iframe')
          const sel = iframe?.contentDocument?.getSelection()
          if (!sel || sel.isCollapsed) return
          const range = sel.getRangeAt(0)
          const rend = renditionRef.current
          if (!rend || typeof rend.getCfiFromRange !== 'function') return
          try {
            const cfiRange = rend.getCfiFromRange(range)
            setSelectionInfo({ text: e.data.text, cfiRange, bounds: e.data.bounds })
          } catch (e) { console.warn('[selection] getCfiFromRange failed', e) }
        }, 50)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const applyLayout = useCallback(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('#viewer iframe')
    if (!iframe?.contentDocument?.head) return
    const l = layoutRef.current
    let style = iframe.contentDocument.getElementById('_reader_layout') as HTMLStyleElement
    if (!style) {
      style = iframe.contentDocument.createElement('style')
      style.id = '_reader_layout'
      iframe.contentDocument.head.appendChild(style)
    }
    style.textContent = `
      body, body * {
        font-size: ${l.fontSize}% !important;
        font-family: ${l.fontFamily} !important;
        font-weight: ${l.fontWeight} !important;
        line-height: ${l.lineHeight} !important;
      }
      body {
        padding: 0 ${l.margin}px !important;
        max-width: 100% !important;
      }
    `
  }, [])

  const updateLayout = useCallback((patch: Partial<ReaderLayout>) => {
    const next = { ...layoutRef.current, ...patch }
    layoutRef.current = next
    setLayoutState(next)
    saveSetting('readerLayout', JSON.stringify(next))
    if (patch.flow) {
      try {
        renditionRef.current?.flow(patch.flow)
      } catch (e) {
        console.warn('[updateLayout] flow change failed:', e)
      }
    }
    applyLayout()
  }, [applyLayout])

  const destroy = useCallback(async () => {
    await saveReadingTime()
    await saveBookReadingTimeFn()
    // 离开前保存最终进度 — use sectionHrefRef as chapterLabel fallback
    if (currentFilePathRef.current) {
      await saveProgress(
        currentFilePathRef.current,
        progressRef.current,
        cfiRef.current,
        indexRef.current,
        sectionHrefRef.current,
        cfiRef.current,
      ).catch(e => console.warn('[destroy] saveProgress failed', e))
    }
    renditionRef.current?.destroy()
    bookRef.current?.destroy()
  }, [saveReadingTime, saveBookReadingTimeFn])

  return { meta, toc, theme, progress, sectionHref, layout, bookmarks, bookmarkCfi, highlights, selectionInfo, customTheme, toggleBookmark, removeBookmarkById, loadBookmarksForBook, addHighlight, removeHighlight, clearSelection, progressRef, cfiRef, indexRef, sectionHrefRef, extractMeta, openBook, initReadingTime, setTheme, setCustomTheme, goNext, goPrev, goToHref, goToCfi, seekTo, applyLayout, updateLayout, getReadingSeconds, getBookReadingSeconds, saveReadingTime, saveBookReadingTime: saveBookReadingTimeFn, resizeViewer, destroy, getChapterText, getFullBookText, searchText: search.searchText, navigateToSearchResult: search.navigateToSearchResult, resetSearch: search.resetSearch }
}
