const DB_NAME = 'coolreader'
const DB_VERSION = 4

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'filePath' })
      }
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'filePath' })
      }
      if (!db.objectStoreNames.contains('readingTime')) {
        db.createObjectStore('readingTime', { keyPath: 'date' })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains('bookData')) {
        db.createObjectStore('bookData', { keyPath: 'filePath' })
      }
      if (!db.objectStoreNames.contains('bookmarks')) {
        const store = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true })
        store.createIndex('filePath', 'filePath', { unique: false })
      }
      if (!db.objectStoreNames.contains('highlights')) {
        const store = db.createObjectStore('highlights', { keyPath: 'id', autoIncrement: true })
        store.createIndex('filePath', 'filePath', { unique: false })
      }
      if (!db.objectStoreNames.contains('bookReadingTime')) {
        const brt = db.createObjectStore('bookReadingTime', { keyPath: ['filePath', 'date'] })
        brt.createIndex('date', 'date', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function store(db: IDBDatabase, name: string, mode: IDBTransactionMode = 'readonly') {
  return db.transaction(name, mode).objectStore(name)
}

export interface BookRecord {
  filePath: string
  title: string
  author: string
  cover?: string
}

export interface ProgressRecord {
  filePath: string
  progress: number
  cfi: string
  index: number
  updatedAt: number
}

export async function saveBook(book: BookRecord): Promise<void> {
  const db = await openDB()
  store(db, 'books', 'readwrite').put(book)
}

export async function deleteBook(filePath: string): Promise<void> {
  const db = await openDB()
  store(db, 'books', 'readwrite').delete(filePath)
  store(db, 'progress', 'readwrite').delete(filePath)
  store(db, 'bookData', 'readwrite').delete(filePath)
  // Cascade-delete bookmarks
  const bmRecords: BookmarkRecord[] = await new Promise((resolve) => {
    const req = store(db, 'bookmarks').index('filePath').getAll(filePath)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve([])
  })
  if (bmRecords.length > 0) {
    const bmTx = db.transaction('bookmarks', 'readwrite')
    await Promise.all(bmRecords.map(r => requestPromise(bmTx.objectStore('bookmarks').delete(r.id!))))
  }
  // Cascade-delete highlights
  const hlRecords: HighlightRecord[] = await new Promise((resolve) => {
    const req = store(db, 'highlights').index('filePath').getAll(filePath)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve([])
  })
  if (hlRecords.length > 0) {
    const hlTx = db.transaction('highlights', 'readwrite')
    await Promise.all(hlRecords.map(r => requestPromise(hlTx.objectStore('highlights').delete(r.id!))))
  }
  // Cascade-delete bookReadingTime for this filePath
  const brtTx = db.transaction('bookReadingTime', 'readwrite')
  const brtReq = brtTx.objectStore('bookReadingTime').openCursor()
  brtReq.onsuccess = () => {
    const cursor = brtReq.result
    if (cursor) {
      const record = cursor.value as { filePath: string }
      if (record.filePath === filePath) cursor.delete()
      cursor.continue()
    }
  }
}

export async function loadAllBooks(): Promise<BookRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = store(db, 'books').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveProgress(filePath: string, progress: number, cfi: string, index: number): Promise<void> {
  const db = await openDB()
  store(db, 'progress', 'readwrite').put({
    filePath, progress, cfi, index,
    updatedAt: Date.now(),
  })
}

export async function loadProgress(filePath: string): Promise<{ progress: number; cfi: string; index: number } | null> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = store(db, 'progress').get(filePath)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => resolve(null)
  })
}

export async function loadAllProgress(): Promise<ProgressRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = store(db, 'progress').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export interface ReadingTimeRecord {
  date: string
  seconds: number
}

export async function saveReadingTime(date: string, seconds: number): Promise<void> {
  const db = await openDB()
  store(db, 'readingTime', 'readwrite').put({ date, seconds })
}

export async function loadReadingTime(date: string): Promise<number> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = store(db, 'readingTime').get(date)
    req.onsuccess = () => resolve(req.result?.seconds ?? 0)
    req.onerror = () => resolve(0)
  })
}

export async function loadReadingTimeRange(from: string, to: string): Promise<{ date: string; seconds: number }[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = store(db, 'readingTime').getAll()
    req.onsuccess = () => {
      const records = req.result as { date: string; seconds: number }[]
      resolve(records.filter(r => r.date >= from && r.date <= to))
    }
    req.onerror = () => reject(req.error)
  })
}

export interface BookReadingTimeRecord {
  filePath: string
  date: string
  seconds: number
}

export async function saveBookReadingTime(filePath: string, date: string, seconds: number): Promise<void> {
  const db = await openDB()
  store(db, 'bookReadingTime', 'readwrite').put({ filePath, date, seconds })
}

export async function loadBookReadingTime(filePath: string, date: string): Promise<number> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = store(db, 'bookReadingTime').get([filePath, date])
    req.onsuccess = () => resolve(req.result?.seconds ?? 0)
    req.onerror = () => resolve(0)
  })
}

export async function loadBookReadingTimeRange(from: string, to: string): Promise<BookReadingTimeRecord[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const range = IDBKeyRange.bound(from, to)
    const req = db.transaction('bookReadingTime', 'readonly').objectStore('bookReadingTime').index('date').getAll(range)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve([])
  })
}

// bookData: store EPUB binary data in IndexedDB (replaces file system)
export async function saveBookData(filePath: string, data: ArrayBuffer): Promise<void> {
  const db = await openDB()
  store(db, 'bookData', 'readwrite').put({ filePath, data })
}

export async function loadBookData(filePath: string): Promise<ArrayBuffer | null> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = store(db, 'bookData').get(filePath)
    req.onsuccess = () => resolve(req.result?.data ?? null)
    req.onerror = () => resolve(null)
  })
}

// settings
export async function saveSetting(key: string, value: string): Promise<void> {
  const db = await openDB()
  store(db, 'settings', 'readwrite').put({ key, value })
}

export async function loadSetting(key: string): Promise<string | null> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = store(db, 'settings').get(key)
    req.onsuccess = () => resolve(req.result?.value ?? null)
    req.onerror = () => resolve(null)
  })
}

// JSON configs stored in settings
import type { WebDAVConfig, AIConfig } from '../types'

export async function saveWebDAVConfig(config: WebDAVConfig): Promise<void> {
  await saveSetting('webdavConfig', JSON.stringify(config))
}

export async function loadWebDAVConfig(): Promise<WebDAVConfig | null> {
  const raw = await loadSetting('webdavConfig')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  await saveSetting('aiConfig', JSON.stringify(config))
}

export async function loadAIConfig(): Promise<AIConfig | null> {
  const raw = await loadSetting('aiConfig')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export interface BookmarkRecord {
  id?: number
  filePath: string
  cfi: string
  label: string
  createdAt: number
}

export async function saveBookmark(bookmark: BookmarkRecord): Promise<void> {
  const db = await openDB()
  store(db, 'bookmarks', 'readwrite').put(bookmark)
}

export async function removeBookmark(id: number): Promise<void> {
  const db = await openDB()
  store(db, 'bookmarks', 'readwrite').delete(id)
}

export interface HighlightRecord {
  id?: number
  filePath: string
  cfiRange: string
  text: string
  color: string
  note?: string
  createdAt: number
}

export async function saveHighlight(hl: HighlightRecord): Promise<void> {
  const db = await openDB()
  store(db, 'highlights', 'readwrite').put(hl)
}

export async function removeHighlight(id: number): Promise<void> {
  const db = await openDB()
  store(db, 'highlights', 'readwrite').delete(id)
}

export async function loadHighlights(filePath: string): Promise<HighlightRecord[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = store(db, 'highlights').index('filePath').getAll(filePath)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve([])
  })
}

export async function loadBookmarks(filePath: string): Promise<BookmarkRecord[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = store(db, 'bookmarks').index('filePath').getAll(filePath)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve([])
  })
}
