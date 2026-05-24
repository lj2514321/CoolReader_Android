import { describe, it, expect } from 'vitest'
import { parseOPDS, getBookDownloadUrl } from '../utils/opds'

describe('opds.ts - OPDS XML parser', () => {
  it('empty feed returns title and empty entries', () => {
    const result = parseOPDS('<feed><title>Test</title></feed>')
    expect(result.title).toBe('Test')
    expect(result.entries).toEqual([])
  })

  it('parses feed title correctly', () => {
    const result = parseOPDS('<feed><title>My OPDS Feed</title></feed>')
    expect(result.title).toBe('My OPDS Feed')
  })

  it('parses single entry with title and url', () => {
    const xml = `
      <feed>
        <title>Test Feed</title>
        <entry>
          <title>Test Book</title>
          <link rel="alternate" href="http://example.com/book.epub"/>
        </entry>
      </feed>
    `
    const result = parseOPDS(xml)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].title).toBe('Test Book')
    expect(result.entries[0].url).toBe('http://example.com/book.epub')
  })

  it('parses entry with author', () => {
    const xml = `
      <feed>
        <title>Test Feed</title>
        <entry>
          <title>Test Book</title>
          <author><name>John Doe</name></author>
          <link rel="alternate" href="http://example.com/book.epub"/>
        </entry>
      </feed>
    `
    const result = parseOPDS(xml)
    expect(result.entries[0].author).toBe('John Doe')
  })

  it('parses multiple entries correctly', () => {
    const xml = `
      <feed>
        <title>Test Feed</title>
        <entry>
          <title>Book One</title>
          <link rel="alternate" href="http://example.com/one.epub"/>
        </entry>
        <entry>
          <title>Book Two</title>
          <link rel="alternate" href="http://example.com/two.epub"/>
        </entry>
      </feed>
    `
    const result = parseOPDS(xml)
    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].title).toBe('Book One')
    expect(result.entries[1].title).toBe('Book Two')
  })

  it('skips entries without title or url', () => {
    const xml = `
      <feed>
        <title>Test Feed</title>
        <entry>
          <title>Valid Book</title>
          <link rel="alternate" href="http://example.com/book.epub"/>
        </entry>
        <entry>
          <title>No URL Book</title>
        </entry>
        <entry>
          <link rel="alternate" href="http://example.com/no-title.epub"/>
        </entry>
      </feed>
    `
    const result = parseOPDS(xml)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].title).toBe('Valid Book')
  })

  it('parses entry with id and type', () => {
    const xml = `
      <feed>
        <title>Test Feed</title>
        <entry>
          <title>Test Book</title>
          <id>urn:uuid:12345</id>
          <link rel="alternate" href="http://example.com/book.epub" type="application/epub+zip"/>
        </entry>
      </feed>
    `
    const result = parseOPDS(xml)
    expect(result.entries[0].id).toBe('urn:uuid:12345')
    expect(result.entries[0].type).toBe('application/epub+zip')
  })

  it('getBookDownloadUrl returns entry url', () => {
    const entry = { title: 'Test', url: 'http://example.com/book.epub' }
    expect(getBookDownloadUrl(entry)).toBe('http://example.com/book.epub')
  })
})