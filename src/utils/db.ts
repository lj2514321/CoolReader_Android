import type { BookFormat, WebDAVConfig, AIConfig, Bookmark, Highlight } from '../types'
import { logger } from './logger'

const DB_NAME = 'coolreader'
const DB_VERSION = 5

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (event) => {
      const db = req.result
      const oldVersion = event.oldVersion
      const tx = req.transaction

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

      // v4 -> v5: add format to books, location + chapterLabel to progress.
      // Existing epub records are migrated losslessly (location == cfi when not set).
      if (oldVersion < 5 && tx) {
        if (db.objectStoreNames.contains('books')) {
          const bookStore = tx.objectStore('books')
          bookStore.openCursor().onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result
            if (cursor) {
              const book = cursor.value as BookRecord & { format?: BookFormat }
              if (!book.format) {
                book.format = 'epub'
                cursor.update(book)
              }
              cursor.continue()
            }
          }
        }
        if (db.objectStoreNames.contains('progress')) {
          const progressStore = tx.objectStore('progress')
          progressStore.openCursor().onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result
            if (cursor) {
              const p = cursor.value as ProgressRecord & { cfi?: string; location?: string; chapterLabel?: string }
              if (p.cfi && !p.location) {
                p.location = p.cfi
                cursor.update(p)
              }
              cursor.continue()
            }
          }
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function store(db: IDBDatabase, name: string, mode: IDBTransactionMode = 'readonly') {
  return db.transaction(name, mode).objectStore(name)
}

function requestPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export interface BookRecord {
  filePath: string
  title: string
  author: string
  cover?: string
  /** Format of the underlying file. Defaults to 'epub' on mobile target. */
  format?: BookFormat
  /** Timestamp of last open, used to sort "recently read" lists and resume-on-startup. */
  lastOpenedAt?: number
}

export interface CoverRecord {
  filePath: string
  data: ArrayBuffer
  mime?: string
}

export async function saveBook(book: BookRecord): Promise<void> {
  const db = await openDB()
  await requestPromise(store(db, 'books', 'readwrite').put(book))
}

export async function updateLastOpenedAt(filePath: string): Promise<void> {
  const db = await openDB()
  const record = await requestPromise<BookRecord | undefined>(
    store(db, 'books').get(filePath)
  )
  if (record) {
    record.lastOpenedAt = Date.now()
    await requestPromise(store(db, 'books', 'readwrite').put(record))
  }
}

export async function deleteBook(filePath: string): Promise<void> {
  const db = await openDB()
  // Cascade-delete using indexed ranges for performance — same shape as source v1.5.4.
  await Promise.all([
    requestPromise(store(db, 'books', 'readwrite').delete(filePath)),
    requestPromise(store(db, 'progress', 'readwrite').delete(filePath)),
    requestPromise(store(db, 'bookData', 'readwrite').delete(filePath)),
    (async () => {
      const bmRecords = await requestPromise<Bookmark[]>(
        store(db, 'bookmarks').index('filePath').getAll(filePath)
      )
      if (bmRecords.length > 0) {
        const bmTx = db.transaction('bookmarks', 'readwrite')
        await Promise.all(bmRecords.map(r => requestPromise(bmTx.objectStore('bookmarks').delete(r.id!))))
      }
    })(),
    (async () => {
      const hlRecords = await requestPromise<Highlight[]>(
        store(db, 'highlights').index('filePath').getAll(filePath)
      )
      if (hlRecords.length > 0) {
        const hlTx = db.transaction('highlights', 'readwrite')
        await Promise.all(hlRecords.map(r => requestPromise(hlTx.objectStore('highlights').delete(r.id!))))
      }
    })(),
    (async () => {
      // Source v1.5.4 fix: use IDBKeyRange on [filePath, '']..[filePath, '￿']
      // instead of walking the whole table with a cursor. Order keys by [filePath, date]
      // so a lexicographic range cleanly captures every date string for this path.
      const brtRange = IDBKeyRange.bound([filePath, ''], [filePath, '￿'])
      const brtRecords = await requestPromise<BookReadingTimeRecord[]>(
        store(db, 'bookReadingTime').getAll(brtRange)
      )
      if (brtRecords.length > 0) {
        const brtTx = db.transaction('bookReadingTime', 'readwrite')
        await Promise.all(brtRecords.map(r => requestPromise(brtTx.objectStore('bookReadingTime').delete([r.filePath, r.date]))))
      }
    })(),
  ])
}

export async function loadAllBooks(): Promise<BookRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = store(db, 'books').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function loadLastOpenedBook(): Promise<BookRecord | null> {
  const all = await loadAllBooks()
  if (all.length === 0) return null
  return all.reduce((best, b) =>
    !best.lastOpenedAt || (b.lastOpenedAt && b.lastOpenedAt > best.lastOpenedAt) ? b : best,
    all[0]
  )
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

export interface ProgressRecord {
  filePath: string
  progress: number
  cfi: string
  /** Universal position string. For epub: CFI. For txt/mobi: 'chapterIdx:charOffset'. */
  location: string
  index: number
  chapterLabel?: string
  updatedAt: number
}

export async function saveProgress(
  filePath: string,
  progress: number,
  cfi: string,
  index: number,
  chapterLabel?: string,
  location?: string
): Promise<void> {
  // Source v1.5.4 fix: only warn when BOTH cfi and location are empty (a txt/mobi
  // adapter will set location but not cfi; the previous check produced log noise).
  if (!cfi && !location) logger.warn('[saveProgress] cfi and location are both empty, index:', index)
  const db = await openDB()
  await requestPromise(store(db, 'progress', 'readwrite').put({
    filePath, progress, cfi, location: location ?? cfi, index, chapterLabel,
    updatedAt: Date.now(),
  }))
}

export async function loadProgress(filePath: string): Promise<{
  progress: number
  cfi: string
  location?: string
  index: number
  chapterLabel?: string
} | null> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = store(db, 'progress').get(filePath)
    req.onsuccess = () => {
      const r = req.result
      if (!r) return resolve(null)
      resolve(r)
    }
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
  await requestPromise(store(db, 'readingTime', 'readwrite').put({ date, seconds }))
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
  /** Universal position string. Mirrors cfi for epub records written before v5. */
  location?: string
  label: string
  createdAt: number
}

export async function saveBookmark(bookmark: BookmarkRecord): Promise<void> {
  const db = await openDB()
  await requestPromise(store(db, 'bookmarks', 'readwrite').put(bookmark))
}

export async function removeBookmark(id: number): Promise<void> {
  const db = await openDB()
  await requestPromise(store(db, 'bookmarks', 'readwrite').delete(id))
}

export interface HighlightRecord {
  id?: number
  filePath: string
  cfiRange: string
  /** Universal position string. Mirrors cfiRange for epub records written before v5. */
  location?: string
  text: string
  color: string
  note?: string
  createdAt: number
}

export async function saveHighlight(hl: HighlightRecord): Promise<void> {
  const db = await openDB()
  await requestPromise(store(db, 'highlights', 'readwrite').put(hl))
}

export async function removeHighlight(id: number): Promise<void> {
  const db = await openDB()
  await requestPromise(store(db, 'highlights', 'readwrite').delete(id))
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
