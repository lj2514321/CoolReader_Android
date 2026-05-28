# Changelog

All notable changes to CoolReader Android will be documented in this file.

## [2.0.0] - 2026-05-28

### Added
- **Reading streak heatmap**: GitHub-style contribution grid with 90-day warm orange-red palette, month labels, day-of-week labels (Mon, Wed, Fri), tap-to-show-day-details, current/longest streak summary badges
- **Notes/Highlights export**: Markdown and TXT format export from Settings
- **Backup & Restore**: JSON metadata export/import (excludes EPUB binaries) with confirmation dialog
- **WebDAV progress sync**: Upload/download reading positions with last-write-wins conflict resolution, manual sync button and background sync on app minimize
- **Reader brightness slider**: CSS overlay-based brightness control in LayoutPanel, persists across sessions
- **OPDS catalog browser**: Browse and search OPDS 1.x/2.0 catalogs, download books directly into library
- **Loading indicators**: Book open spinner, search index building indicator
- **Error handling**: User-visible toast notifications for critical errors instead of silent console.warn
- **ErrorBoundary component**: Wraps root to prevent white/purple screen on mount errors
- **NoteDialog modal component**: Replaces broken `prompt()` on mobile
- **useSwipe hook**: Horizontal swipe detection with 50px threshold, 300ms debounce, text-selection blocking
- **useKeyboard hook**: Keyboard avoidance using VisualViewport API
- **Status bar and navigation bar auto-hide**: Android immersive reading mode on entering Reader
- Touch targets bumped to 44px minimum (Material Design 48dp equivalent): SelectionToolbar color buttons, BookShelf delete button, panel close buttons, Settings/Stats buttons

### Changed
- **Safe-area CSS**: Complete adaptation across all components using `env(safe-area-inset-*)`:
  - `index.html`: global `#root` safe-area padding + `viewport-fit=cover`
  - Reader top bar: `padding-top: calc(12px + max(env(safe-area-inset-top), 48px))`
  - Reader bottom bar: `padding-bottom: calc(8px + env(safe-area-inset-bottom))`
  - Reader #viewer: `paddingTop/Bottom` with safe-area
  - Library content area: `padding-top: env(safe-area-inset-top)`
  - All floating panels (LayoutPanel, MarkersPanel, Sidebar, AIPanel)
- **StatusBar plugin**: Integrated `@capacitor/status-bar` with `setOverlaysWebView({ overlay: true })`
- **Reader layout**: Full-screen `position: fixed; inset: 0` layout (not dependent on #root padding)
- **Reader bottom bar**: Completely restructured from single-row to two-row layout:
  - Row 1: [◂] [progress bar + %] [▸] (page-turn controls)
  - Row 2: [📑 目录] [Aa 主题] [🖍️ 笔记] [🛠️ 工具] (direct-access buttons)
  - "工具" opens inline ToolsPopup with [🔍 搜索] and [🤖 AI]
- **Reader top bar**: Slimmed to back button and book title only (all secondary controls moved to bottom sheet/popups)
- **LayoutPanel**: Combined theme panel now includes theme mode switcher (light/sepia/dark/custom), brightness slider, and font/layout controls
- **Reader exit animation**: Fade and slide-down transition (250ms ease)
- **Swipe tap zones**: Redesigned (22%/56%/22% → 30% prev / 40% toggle / 30% next)
- **Home page**: Book cards enlarged (110px → 140px width, 64×86 → 85×115 cover size, 12 → 16px gap); "📚 全部书籍" section header added above bookshelf grid
- **Reader Row 2 buttons**: `gap: 4 → 12`, added `justifyContent: 'center'`
- **Dark theme color**: Unified to `#0f0c29` across all components (Reader, LayoutPanel, Sidebar, MarkersPanel)
- **Glassmorphism styling**: Consistent across all panels
- **Theme color palette**: Extracted to `src/utils/styles.ts`
- **tap-highlight-color**: Removed blue overlay on mobile (`-webkit-tap-highlight-color: transparent`)
- **CSS compatibility**: `backdrop-filter` fallbacks for older WebViews, `env()` with fallback values
- **touch-action and overscroll-behavior**: Applied globally (`touch-action: manipulation`, `overscroll-behavior: none`)

### Fixed
- **useEpub useEffect infinite loop**: Changed dependency from `[epub]` to `[]` — P0 startup hang/紫屏 bug
- **Android back button**: Now properly returns to Library from Reader
- **Swipe page-turn triggering floating UI bars**: Added `isSwipingRef` to prevent conflict
- **#viewer content cropped by system bars**: Added safe-area padding
- **prompt() on mobile**: Replaced with custom NoteDialog modal
- **Duplicate search box on home page**: Removed second instance
- **Bookshelf filter hiding books with reading progress**: Filter logic corrected
- **Streak heatmap squares overflowing card horizontally**: Layout fixed
- **AI button overlapping bottom bar**: Moved into tools popup
- **Floating panels overflowing on mobile viewport**: LayoutPanel, MarkersPanel, Sidebar, AIPanel all fixed
- **Reader exit animation**: Added fade + slide-down, 250ms ease

### Removed
- **BottomSheet.tsx**: Component deleted entirely
- **showMenu state**: No longer needed, removed from Reader
- **Second search box instance**: Removed duplicate from home page

### Performance
- **backdrop-filter**: Reduced usage in bottom sheet and panels (solid background colors instead, better Android WebView performance)
- **GPU-accelerated CSS transitions**: Using `opacity` and `transform` only
- **will-change**: Applied to animated elements for compositor promotion
- **touch-action: manipulation**: Reduces touch delay on mobile
- **overscroll-behavior: none**: Prevents scroll chaining and pull-to-refresh gestures