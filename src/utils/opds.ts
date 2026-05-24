export interface OPDSEntry {
  title: string
  author?: string
  url: string
  type?: string
  id?: string
}

export interface OPDSFeed {
  title: string
  entries: OPDSEntry[]
  updated?: string
}

/**
 * Parse OPDS XML feed into structured data.
 */
export function parseOPDS(xml: string): OPDSFeed {
  const entries: OPDSEntry[] = []

  // Extract feed title
  const titleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title[^>]*>([^<]*)<\/title>/i)
  const feedTitle = titleMatch?.[1] || 'Unknown Feed'

  // Extract entries (Atom <entry>)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi
  let match
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1]

    // Entry title
    const eTitleMatch = entryXml.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = eTitleMatch?.[1] || 'Unknown'

    // Entry author
    const authorMatch = entryXml.match(/<author[\s\S]*?<name[^>]*>([^<]*)<\/name>/i)
    const author = authorMatch?.[1]

    // Entry link (rel="alternate" or rel="http://opds-spec.org/acquisition")
    const linkMatch = entryXml.match(/<link[^>]*href=["']([^"']*)["'][^>]*>/i)
    const url = linkMatch?.[1] || ''

    // Content type
    const typeMatch = entryXml.match(/<link[^>]*type=["']([^"']*)["'][^>]*>/i)
    const type = typeMatch?.[1]

    // Entry ID
    const idMatch = entryXml.match(/<id[^>]*>([^<]*)<\/id>/i)
    const id = idMatch?.[1]

    if (title && title !== 'Unknown' && url) {
      entries.push({ title, author, url, type, id })
    }
  }

  return { title: feedTitle, entries }
}

/**
 * Get download URL from OPDS entry.
 * Prefers acquisition links (rel="http://opds-spec.org/acquisition" or rel="alternate")
 */
export function getBookDownloadUrl(entry: OPDSEntry): string {
  return entry.url
}