import { describe, it, expect } from 'vitest'
import { exportBackup, importBackup } from '../utils/backup'

describe('backup.ts - Backup/restore service', () => {
  describe('exportBackup', () => {
    it('returns object with version 1 and timestamp', async () => {
      const result = await exportBackup()
      expect(result).toHaveProperty('version', 1)
      expect(result).toHaveProperty('timestamp')
      expect(typeof result.timestamp).toBe('number')
    })

    it('returns object with all required fields', async () => {
      const result = await exportBackup()
      expect(result).toHaveProperty('version')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('books')
      expect(result).toHaveProperty('readingTime')
      expect(result).toHaveProperty('highlights')
      expect(result).toHaveProperty('bookmarks')
      expect(result).toHaveProperty('settings')
      expect(Array.isArray(result.books)).toBe(true)
      expect(Array.isArray(result.readingTime)).toBe(true)
      expect(Array.isArray(result.highlights)).toBe(true)
      expect(Array.isArray(result.bookmarks)).toBe(true)
      expect(typeof result.settings).toBe('object')
    })

    it('books array does not contain base64 cover data', async () => {
      const result = await exportBackup()
      // Empty books array or books without cover data
      for (const book of result.books) {
        expect(book.cover).toBeUndefined()
      }
    })
  })

  describe('importBackup', () => {
    it('handles unsupported version', async () => {
      const result = await importBackup({ version: 999 } as any)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Unsupported backup version')
    })

    it('handles empty backup data with version 1', async () => {
      const emptyBackup = {
        version: 1,
        timestamp: Date.now(),
        books: [],
        readingTime: [],
        highlights: [],
        bookmarks: [],
        settings: {},
      }
      const result = await importBackup(emptyBackup)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns success for valid backup with partial data', async () => {
      const partialBackup = {
        version: 1,
        timestamp: Date.now(),
        books: [],
        readingTime: [{ date: '2024-01-01', seconds: 120 }],
        highlights: [],
        bookmarks: [],
        settings: { themeMode: 'dark' },
      }
      const result = await importBackup(partialBackup)
      expect(result.success).toBe(true)
    })
  })
})