# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Production build to dist/
npm run lint         # Run ESLint
npx cap sync android # Sync web assets to Android
cd android && ./gradlew assembleDebug  # Build debug APK
```

## Architecture

### Stack
- **React 18 + TypeScript** with Vite for web bundling
- **Capacitor 8** wrapping the app for Android (CoolReader app ID: `com.coolreader.app`)
- **epubjs** for EPUB rendering
- **IndexedDB** for all local persistence (books, progress, reading time, settings, bookmarks, highlights)

### State Flow
- `App.tsx` is the root component. It owns top-level state (books list, current reader path, WebDAV/AI config, reading time) and passes it down to `Library` and `Reader`
- `useEpub` hook encapsulates all EPUB book state: metadata, TOC, theme, layout, progress, bookmarks, highlights, selection, custom theme
- `db.ts` provides all IndexedDB operations via a thin promise wrapper over `IDBTransaction`

### Key Files
- `src/App.tsx` — Root component, routing between Library and Reader
- `src/hooks/useEpub.ts` — Core EPUB hook; owns Book/Rendition refs, persists progress/reading time on page turns
- `src/utils/db.ts` — IndexedDB facade (books, progress, readingTime, settings, bookData, bookmarks, highlights stores)
- `src/components/Reader.tsx` — Full-screen reader with sidebar navigation (TOC, bookmarks, highlights, layout, AI panel)
- `src/components/Library.tsx` — Home screen with BookShelf, import, stats, and settings pages
- `src/types/index.ts` — Shared types (BookMeta, ReaderLayout, ThemeMode, CustomTheme, Highlight, Bookmark, etc.)

### Data Storage
Books are stored as ArrayBuffer in IndexedDB (`bookData` store), not on the file system. On import, the EPUB binary is saved via `saveBookData()` and metadata is extracted with `epub.extractMeta()`.

Reading progress is keyed by `filePath` and saved on each relocation. Reading time is accumulated per day (date string key).

### EPUB Rendering
- epubjs `Book` and `Rendition` instances are held in refs within `useEpub`
- Rendition renders into a `#viewer` div; layout CSS is injected into the iframe's document head
- Text selection in the iframe posts a message to the parent window with selection text and bounds
- Highlights use epubjs `annotations.highlight()` API with CFI ranges
- Bookmarks are stored in IndexedDB and compared by CFI

### Theme System
Four modes: `light`, `dark`, `sepia`, `custom`. Custom theme generates CSS via `generateCustomThemeCSS()` with gradient support. CSS is registered with epubjs themes.

### WebDAV Sync
SyncSettings component uses `src/utils/webdav.ts` to upload/download books and progress via WebDAV protocol. Config stored in IndexedDB settings as JSON.

### AI Features
AISettings/AIPanel components integrate with an external AI API (configurable endpoint + API key + model). `useEpub` exposes `getChapterText()` and `getFullBookText()` for AI context.