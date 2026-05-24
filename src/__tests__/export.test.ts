import { describe, it, expect } from 'vitest'
import { exportToMarkdown, exportToTxt } from '../utils/export'
import type { Highlight } from '../types'

const createHighlight = (overrides: Partial<Highlight> = {}): Highlight => ({
  filePath: '/test/book.epub',
  cfiRange: 'epubcfi(/6/4)',
  text: '',
  color: 'yellow',
  createdAt: Date.now(),
  ...overrides,
})

describe('export.ts - Export highlights and notes', () => {
  describe('exportToMarkdown', () => {
    it('empty highlights returns only title', () => {
      const result = exportToMarkdown([], 'Test Book')
      expect(result).toBe('# Test Book\n\n')
    })

    it('highlight with text is formatted correctly', () => {
      const highlights = [createHighlight({ text: 'hello', chapter: 'Ch1', color: 'yellow' })]
      const result = exportToMarkdown(highlights, 'Book')
      expect(result).toContain('"hello"')
      expect(result).toContain('@ Ch1')
      expect(result).toContain('[yellow]')
    })

    it('note is formatted correctly', () => {
      const highlights = [createHighlight({ note: 'my note', chapter: 'Ch2' })]
      const result = exportToMarkdown(highlights, 'Book')
      expect(result).toContain('my note')
      expect(result).toContain('@ Ch2')
    })

    it('separates notes and highlights sections', () => {
      const highlights = [
        createHighlight({ text: 'quote', chapter: 'Ch1' }),
        createHighlight({ note: 'note', chapter: 'Ch2' }),
      ]
      const result = exportToMarkdown(highlights, 'Book')
      expect(result).toContain('## Notes')
      expect(result).toContain('## Highlights')
    })

    it('uses Unknown chapter when chapter is missing', () => {
      const highlights = [createHighlight({ text: 'text', chapter: undefined })]
      const result = exportToMarkdown(highlights, 'Book')
      expect(result).toContain('Unknown')
    })

    it('uses yellow color when color is missing', () => {
      const highlights = [createHighlight({ text: 'text', color: undefined })]
      const result = exportToMarkdown(highlights, 'Book')
      expect(result).toContain('[yellow]')
    })
  })

  describe('exportToTxt', () => {
    it('empty highlights returns only title with underline', () => {
      const result = exportToTxt([], 'Test Book')
      // "Test Book" is 9 chars, so 9 = signs
      expect(result).toBe('Test Book\n=========\n')
    })

    it('highlight with text is formatted correctly', () => {
      const highlights = [createHighlight({ text: 'hello', chapter: 'Ch1' })]
      const result = exportToTxt(highlights, 'Book')
      expect(result).toContain('"hello"')
      expect(result).toContain('(Ch1)')
      expect(result).toContain('HIGHLIGHTS:')
    })

    it('note is formatted correctly', () => {
      const highlights = [createHighlight({ note: 'my note', chapter: 'Ch2' })]
      const result = exportToTxt(highlights, 'Book')
      expect(result).toContain('my note')
      expect(result).toContain('(Ch2)')
      expect(result).toContain('NOTES:')
    })

    it('separates notes and highlights in output', () => {
      const highlights = [
        createHighlight({ text: 'quote', chapter: 'Ch1' }),
        createHighlight({ note: 'note', chapter: 'Ch2' }),
      ]
      const result = exportToTxt(highlights, 'Book')
      expect(result).toContain('NOTES:')
      expect(result).toContain('HIGHLIGHTS:')
    })

    it('uses Unknown chapter when chapter is missing', () => {
      const highlights = [createHighlight({ text: 'text', chapter: undefined })]
      const result = exportToTxt(highlights, 'Book')
      expect(result).toContain('(Unknown)')
    })
  })
})