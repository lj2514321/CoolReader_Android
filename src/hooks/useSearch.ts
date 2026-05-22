import { useCallback, useRef } from 'react'
import { Book, Rendition } from 'epubjs'
import { NavItem, SearchResult } from '../types'

export function useSearch() {
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const indexRef = useRef(0)
  const tocRef = useRef<NavItem[]>([])
  const searchIndexRef = useRef<{ href: string; text: string }[]>([])
  const syncRef = useRef<() => void>(() => {})

  const register = useCallback((
    book: Book,
    rendition: Rendition,
    toc: NavItem[],
    index: number,
    sync: () => void,
  ) => {
    bookRef.current = book
    renditionRef.current = rendition
    tocRef.current = toc
    indexRef.current = index
    syncRef.current = sync
  }, [])

  const getChapterLabel = useCallback((chapterIndex: number): string => {
    const items = tocRef.current
    const spine = (bookRef.current?.spine as any)
    const href = spine?.items?.[chapterIndex]?.href
    if (!href) return `第 ${chapterIndex + 1} 章`
    const find = (list: NavItem[]): string | null => {
      for (const item of list) {
        if (item.href === href || item.href.endsWith(href)) return item.label
        if (item.subitems) {
          const r = find(item.subitems)
          if (r) return r
        }
      }
      return null
    }
    return find(items) || `第 ${chapterIndex + 1} 章`
  }, [])

  const buildSearchIndex = useCallback(async () => {
    const book = bookRef.current
    if (!book) return
    const spine = book.spine as any
    const items = spine?.items || []
    const index: { href: string; text: string }[] = []
    for (const item of items) {
      if (!item.href) continue
      try {
        const html = await book.archive.getText(item.url)
        const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        index.push({ href: item.href, text })
      } catch (e) { console.warn('[buildSearchIndex] failed for', item.href, e); index.push({ href: item.href, text: '' }) }
    }
    searchIndexRef.current = index
  }, [])

  const searchText = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return []
    if (searchIndexRef.current.length === 0) await buildSearchIndex()
    const lq = query.toLowerCase()
    const results: SearchResult[] = []
    for (let i = 0; i < searchIndexRef.current.length; i++) {
      const { href, text } = searchIndexRef.current[i]
      const lower = text.toLowerCase()
      let pos = 0
      let mi = 0
      while (pos < lower.length) {
        const idx = lower.indexOf(lq, pos)
        if (idx === -1) break
        results.push({
          chapterIndex: i,
          chapterHref: href,
          chapterLabel: getChapterLabel(i),
          matchIndex: mi++,
          contextBefore: text.slice(Math.max(0, idx - 40), idx),
          matchText: text.slice(idx, idx + query.length),
          contextAfter: text.slice(idx + query.length, idx + query.length + 40),
        })
        pos = idx + 1
      }
    }
    return results
  }, [buildSearchIndex, getChapterLabel])

  const navigateToSearchResult = useCallback(async (result: SearchResult) => {
    const rendition = renditionRef.current
    if (!rendition) return
    try {
      await rendition.display(result.chapterIndex)
      requestAnimationFrame(syncRef.current)
      setTimeout(() => {
        const iframe = document.querySelector<HTMLIFrameElement>('#viewer iframe')
        if (!iframe?.contentDocument?.body) return
        const doc = iframe.contentDocument
        const script = doc.createElement('script')
        script.textContent = `
          (function() {
            var text = ${JSON.stringify(result.matchText)};
            if (!text) return;
            var walker = document.createTreeWalker(document.body, 4 /* SHOW_TEXT */);
            while (walker.nextNode()) {
              var node = walker.currentNode;
              if (node.textContent.indexOf(text) !== -1) {
                var range = document.createRange();
                range.selectNodeContents(node);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                node.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
              }
            }
          })();
        `
        doc.head.appendChild(script)
        script.remove()
      }, 150)
    } catch (e) { console.warn('[navigateToSearchResult] display failed', e) }
  }, [])

  const resetSearch = useCallback(() => {
    searchIndexRef.current = []
  }, [])

  return { register, searchText, navigateToSearchResult, resetSearch }
}
