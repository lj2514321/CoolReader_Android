import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { BookRecord } from '../utils/db'

export type SortKey = 'title' | 'author' | 'recent'
export type FilterStatus = 'all' | 'reading' | 'unread' | 'finished'

const HISTORY_KEY = 'bookSearchHistory'
const MAX_HISTORY = 10
const PAGE_SIZE = 20

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(items: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

interface UseBookSearchOptions {
  books: BookRecord[]
  progressRecords: { filePath: string; progress: number; updatedAt: number }[]
}

export function useBookSearch({ books, progressRecords }: UseBookSearchOptions) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [page, setPage] = useState(1)
  const [history, setHistory] = useState<string[]>(loadHistory)
  const [showHistory, setShowHistory] = useState(false)
  const progressMap = useMemo(() => new Map(progressRecords.map(p => [p.filePath, p])), [progressRecords])

  // Reset page when filters change
  const prevFiltersRef = useRef({ query, sortKey, filterStatus })
  useEffect(() => {
    const prev = prevFiltersRef.current
    if (prev.query !== query || prev.sortKey !== sortKey || prev.filterStatus !== filterStatus) {
      setPage(1)
      prevFiltersRef.current = { query, sortKey, filterStatus }
    }
  }, [query, sortKey, filterStatus])

  const addToHistory = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    setHistory(prev => {
      const next = [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, MAX_HISTORY)
      saveHistory(next)
      return next
    })
  }, [])

  const removeFromHistory = useCallback((term: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h !== term)
      saveHistory(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = books

    // Text filter
    if (q) {
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      list = list.filter(b => {
        const p = progressMap.get(b.filePath)
        if (filterStatus === 'unread') return !p || p.progress === 0
        if (filterStatus === 'reading') return p && p.progress > 0 && p.progress < 0.98
        if (filterStatus === 'finished') return p && p.progress >= 0.98
        return true
      })
    }

    // Sort
    const sorted = [...list].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title)
      if (sortKey === 'author') return a.author.localeCompare(b.author)
      if (sortKey === 'recent') {
        const pa = progressMap.get(a.filePath)
        const pb = progressMap.get(b.filePath)
        return (pb?.updatedAt ?? 0) - (pa?.updatedAt ?? 0)
      }
      return 0
    })

    return sorted
  }, [books, query, sortKey, filterStatus, progressMap])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paged = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page])
  const hasMore = page < totalPages

  const loadMore = useCallback(() => {
    setPage(p => Math.min(p + 1, totalPages))
  }, [totalPages])

  const submitSearch = useCallback((term?: string) => {
    const t = (term ?? query).trim()
    if (t) addToHistory(t)
    setShowHistory(false)
  }, [query, addToHistory])

  return {
    query, setQuery,
    sortKey, setSortKey,
    filterStatus, setFilterStatus,
    page, hasMore, loadMore,
    total, totalPages,
    results: paged,
    history, showHistory, setShowHistory,
    addToHistory, removeFromHistory, clearHistory,
    submitSearch,
  }
}
