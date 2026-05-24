import { loadAllBooks, saveBook } from './db'
import { loadReadingTimeRange, saveReadingTime } from './db'
import { saveHighlight, saveBookmark, HighlightRecord, BookmarkRecord } from './db'
import { loadSetting, saveSetting } from './db'
import type { BookRecord } from './db'
import type { Highlight, Bookmark } from '../types'

export interface BackupData {
  version: number   // 1
  timestamp: number
  books: BookRecord[]
  readingTime: { date: string; seconds: number }[]
  highlights: Highlight[]
  bookmarks: Bookmark[]
  settings: Record<string, unknown>
}

export async function exportBackup(): Promise<BackupData> {
  // Load all books
  const books = await loadAllBooks()
  
  // Load reading time (all records, using far date range)
  const readingTime = await loadReadingTimeRange('1970-01-01', '2099-12-31')
  
  // Load highlights and bookmarks (empty for export - they require filePath)
  // Note: We store highlights/bookmarks per-book, so global export needs special handling
  const highlights: Highlight[] = []
  const bookmarks: Bookmark[] = []
  
  // Load all settings by iterating known keys
  const settings: Record<string, unknown> = {}
  // We export known settings keys that are JSON configs
  const knownSettings = ['webdavConfig', 'aiConfig', 'readerLayout', 'themeMode', 'customTheme']
  for (const key of knownSettings) {
    const value = await loadSetting(key)
    if (value !== null) {
      try {
        settings[key] = JSON.parse(value)
      } catch {
        settings[key] = value
      }
    }
  }
  
  // Strip cover base64 from books (don't backup large cover images)
  const cleanBooks = books.map(b => ({
    ...b,
    cover: undefined,  // Remove base64 cover to reduce backup size
  }))
  
  return {
    version: 1,
    timestamp: Date.now(),
    books: cleanBooks,
    readingTime,
    highlights,
    bookmarks,
    settings,
  }
}

export async function importBackup(data: BackupData): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []
  
  if (data.version !== 1) {
    return { success: false, errors: ['Unsupported backup version'] }
  }
  
  try {
    // Restore books (without cover - user will need to re-add)
    if (data.books) {
      for (const book of data.books) {
        await saveBook(book)
      }
    }
  } catch (e) {
    errors.push(`Books restore error: ${e}`)
  }
  
  try {
    if (data.readingTime) {
      for (const rt of data.readingTime) {
        await saveReadingTime(rt.date, rt.seconds)
      }
    }
  } catch (e) {
    errors.push(`ReadingTime restore error: ${e}`)
  }
  
  try {
    if (data.highlights) {
      for (const hl of data.highlights) {
        const record: HighlightRecord = {
          filePath: hl.filePath,
          cfiRange: hl.cfiRange,
          text: hl.text,
          color: hl.color,
          note: hl.note,
          createdAt: hl.createdAt,
        }
        await saveHighlight(record)
      }
    }
  } catch (e) {
    errors.push(`Highlights restore error: ${e}`)
  }
  
  try {
    if (data.bookmarks) {
      for (const bm of data.bookmarks) {
        const record: BookmarkRecord = {
          filePath: bm.filePath,
          cfi: bm.cfi,
          label: bm.label,
          createdAt: bm.createdAt,
        }
        await saveBookmark(record)
      }
    }
  } catch (e) {
    errors.push(`Bookmarks restore error: ${e}`)
  }
  
  try {
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        await saveSetting(key, JSON.stringify(value))
      }
    }
  } catch (e) {
    errors.push(`Settings restore error: ${e}`)
  }
  
  return { success: errors.length === 0, errors }
}