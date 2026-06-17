// epub.js type patches — augments bundled epubjs type definitions with runtime
// APIs that are missing from the upstream types. Mirrors src/types/epub.d.ts in
// the source project (coolreader v1.5.x) so future Txt/Mobi adapters can plug
// into the same BookAdapter abstraction without `as any` casts.
//
// Declaration merging rules: epubjs exports real `default class Book`, `default
// class Rendition`, etc. We add `interface Book`/`interface Rendition` etc. to
// extend instance types via TypeScript's class+interface merging.

declare module 'epubjs' {
  // Section: epubjs's bundled Section class declares href/url but NOT label/
  // subitems — yet the source project reads `nav.toc[i].label/subitems` from
  // the navigation tree. The target only navigates by href, so leave it alone.

  // Spine: the public Spine class exposes only get/first/last — but the reader
  // walks `book.spine.items[idx].href` and `book.spine.length` at runtime.
  interface Spine {
    items: Array<{ href?: string; index?: number; url?: string }>
    length: number
  }

  // Book.packaging.metadata is read at runtime (cf. extractMeta).
  interface Book {
    packaging?: {
      metadata?: {
        title?: string
        creator?: string
      }
    }
    // Loaded navigation tree (toc[] is read off this promise).
    readonly loaded: {
      navigation: Promise<{
        toc: Array<{
          id: string
          href: string
          label: string
          subitems?: Array<{
            id: string
            href: string
            label: string
            subitems?: unknown[]
          }>
          parent?: string
        }>
      }>
    }
  }

  // Rendition.currentLocation returns { start: { cfi, index, href? } }.
  interface LocationStart {
    cfi: string
    index: number | string
    href?: string
  }
  interface Rendition {
    currentLocation(): { start?: LocationStart } | undefined
    /** Themes API used by useEpub to register / select theme CSS. */
    themes: {
      select(theme: string): void
      registerCss(name: string, css?: string): void
    }
    /** getCfiFromRange is required for selection-to-highlight conversion. */
    getCfiFromRange(range: Range): string
  }
}

declare module 'epubjs/types/navigation' {
  export interface NavItem {
    id: string
    href: string
    label: string
    subitems?: NavItem[]
    parent?: string
  }
  /** Backward-compat alias used by the source project's EpubAdapter. */
  export type EpubNavItem = NavItem
}
