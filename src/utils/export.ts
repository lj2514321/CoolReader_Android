import type { Highlight } from '../types'

/**
 * Export highlights and notes to Markdown format.
 * Format:
 * # {bookTitle}
 * ## Notes
 * - {note text} @ {chapter}
 * ## Highlights
 * - "{highlight text}" @ {chapter} [{color}]
 */
export function exportToMarkdown(highlights: Highlight[], bookTitle: string): string {
  const notes = highlights.filter(h => h.note)
  const highlightsOnly = highlights.filter(h => !h.note && h.text)

  let md = `# ${bookTitle}\n\n`

  if (notes.length > 0) {
    md += `## Notes\n`
    for (const n of notes) {
      md += `- ${n.note} @ ${n.chapter || 'Unknown'}\n`
    }
    md += `\n`
  }

  if (highlightsOnly.length > 0) {
    md += `## Highlights\n`
    for (const h of highlightsOnly) {
      md += `- "${h.text}" @ ${h.chapter || 'Unknown'} [${h.color || 'yellow'}]\n`
    }
  }

  return md
}

/**
 * Export highlights and notes to plain text format.
 */
export function exportToTxt(highlights: Highlight[], bookTitle: string): string {
  const lines: string[] = []
  lines.push(bookTitle)
  lines.push('='.repeat(bookTitle.length))
  lines.push('')

  const notes = highlights.filter(h => h.note)
  const highlightsOnly = highlights.filter(h => !h.note && h.text)

  if (notes.length > 0) {
    lines.push('NOTES:')
    for (const n of notes) {
      lines.push(`  * ${n.note} (${n.chapter || 'Unknown'})`)
    }
    lines.push('')
  }

  if (highlightsOnly.length > 0) {
    lines.push('HIGHLIGHTS:')
    for (const h of highlightsOnly) {
      lines.push(`  "${h.text}" (${h.chapter || 'Unknown'})`)
    }
  }

  return lines.join('\n')
}