# Changelog

All notable changes to CoolReader Android will be documented in this file.

## [2.1.0] - 2026-06-17

### Design system overhaul — "墨色书房" (Direction A+C)

Global UI refactor applying the **Direction A+C hybrid (墨色书房 + 油灯灯光渐变)** design language to every component. The goal was a warm, dark scholarly aesthetic with amber lamp accents and seal-red stamps before real-device testing.

#### Design tokens & foundations
- **New CSS files** (`src/styles/`): `typography.css` (serif display font, type scale), `colors.css` (design tokens: --cr-lamp, --cr-flame, --cr-seal), `glass.css` (lamp-light, vignette, flame-progress utilities)
- **Design tokens**: `--cr-lamp: #e8a04a`, `--cr-flame: #ff7b3a`, `--cr-seal: #a8431e` (amber/flame/seal-red palette)
- **Font system**: `fontDisplay` = Georgia + Noto Serif SC (serif) for headings and labels; `fontBody` = system-ui for body text
- **Global borderRadius: 2** — "书页直角感" (book-page sharp corners) applied to all interactive elements (buttons, cards, inputs, panels, chips, toggles)
- **Glass morphism**: Consistent `backdrop-filter: blur(20px) saturate(140%)`, opacity 0.92 for panels

#### Component changes
- **SettingsPage**: Title "设置" → "墨 · 书房" with "SETTINGS" English eyebrow; SectionLabel component with amber line prefix; borderless settings items
- **StatsPage**: Header "阅读统计" → "灯 · 心迹" with "STATISTICS" eyebrow; summary cards in bordered grid; flame progress bar; 14-day chart with amber→flame gradient bars
- **SidebarNav**: Seal-red corner-cut triangle in top-right; underline tab indicator (scaleX animation); `fontDisplay` at 11px for labels
- **Sidebar**: "CONTENTS" English eyebrow; corner-cut seal in top-left; amber left-border on active TOC items
- **Library**: Vignette overlay (`radial-gradient ... rgba(5,3,2,0.45) 100%`); radial gradient uses `--cr-lamp` (#e8a04a)
- **MarkersPanel**: Corner-cut seal stamp "MARK"; underline tab indicators; highlight swatches use corner-cut `clip-path`
- **LayoutPanel**: Corner-cut seal "SET"; "LAYOUT" eyebrow; Section component for grouping; slider values in amber serif font
- **AIPanel**: Corner-cut seal "AI"; chat bubbles and input borderRadius: 2; glass with blur 20px
- **Reader toolbar**: All borderRadius: 2; title and progress in `fontDisplay`; search popup with backdrop-filter blur(20px)
- **CustomThemePanel**: Corner-cut seal "THEME"; header fontDisplay at 16px; chips and color inputs borderRadius: 2
- **SelectionToolbar**: borderRadius: 2, blur 20px
- **NoteDialog**: Corner-cut seal "NOTE"; borderRadius: 2, blur 20px, opacity 0.92
- **StreakHeatmap**: Container borderRadius: 2; tooltip blur 20px; streak badges in `fontDisplay`
- **SearchBar**: Container, history dropdown, filter/sort chips all borderRadius: 2; amber glow removed from active chips
- **BookGrid**: Cards, cover images, empty state all borderRadius: 2; book titles in `fontDisplay`; "加载更多" button borderRadius: 2

#### Infrastructure
- **Removed** seed dev-books code from App.tsx (was previously added for testing)
- **JDK compatibility note**: Capacitor 8.3 + AGP 8.13 requires JDK 21 (Android Studio bundled `jbr`); JDK 17 causes "invalid source release: 21"

#### Verification
- Vite production build: 0 errors, 141 modules transformed
- `capacitor-android:compileDebugJavaWithJavac`: JDK 21 resolves compilation
- APK installed and verified on Android emulator

## [Unreleased] — 源项目同步

### 同步自 epub-reader-demo（coolreader v1.5.x）

#### 类型系统与 DB 改造
- **DB schema 升级 v4 → v5**：增量迁移无损 — 为已有 books 记录补充 `format='epub'`，将 progress.cfi 复制到新增的 `location` 字段；新增 `progress.chapterLabel`、`books.lastOpenedAt`、`books.format`、`bookmarks.location`、`highlights.location`（后两个为可选以兼容旧数据）
- **`BookFormat` 类型**：`'epub' | 'txt' | 'mobi'` — 类型层面对齐源项目，未来添加 TXT/MOBI 适配器无需修改消费方
- **`CustomBgConfig` 与 `defaultCustomBg`**：新增首页壁纸配置类型与默认值（preset/color/gradient/image 四类）
- **`updateLastOpenedAt(filePath)`**：打开书籍时更新时间戳，供"继续阅读"按最近打开排序
- **`loadLastOpenedBook()`**：返回 `lastOpenedAt` 最大的书籍记录
- **`bookReadingTime` 级联清理**：`deleteBook` 使用 `IDBKeyRange.bound` 按 filePath 范围删除关联阅读时长（替代旧的全表游标扫描）
- **`saveProgress` 增强**：可选 `chapterLabel` 与 `location` 参数；空 cfi/location 警告只在两者同时缺失时触发（避免 TXT/MOBI 场景的日志噪音）

#### epub.js 类型扩展
- **新增 `src/types/epub.d.ts`**：通过声明合并补齐 epubjs 0.3 缺失的 `Spine.items/length`、`Book.packaging.metadata`、`Book.loaded.navigation`、`Rendition.currentLocation/themes/getCfiFromRange` 等 API 形状
- **移除 `as any` 强制转型**：`useEpub.ts` 中 6 处 `book.spine as any`/`rendition.currentLocation() as any`/`renditionRef.current as any` 已用真实类型替换

#### 工具与基础设施
- **`src/utils/formatDetection.ts`**：新增 `getFormatFromPath` / `isSupportedFile` / `getSupportedExtensions`；与源项目保持一致的错误处理（不支持格式抛错）
- **`src/utils/logger.ts`**：新增轻量 logger，dev 模式输出 debug/info，prod 仅输出 warn/error

#### 自定义背景壁纸
- **`src/components/WallpaperEditor.tsx`**（新）：四标签页（预设/纯色/渐变/图片），完整颜色选择器与渐变编辑器（线性/径向 + ≥2 色标 + 角度）
- **图片上传**：支持本地图片上传（≤2MB），通过 FileReader 转为 base64 存入 IndexedDB setting
- **`SettingsPage` 集成**：原"首页背景"详情页替换为 WallpaperEditor
- **`App.tsx` 应用 customBg**：`color`/`gradient`/`image` 配置覆盖默认渐变 preset；preset 模式下保持原 `bgKey`/`bgGradient` 路径以兼容现有 Library 状态
- **`Library.tsx` 透传** `customBg` 与 `onCustomBgChange` 到 SettingsPage

#### Bug 修复（与源项目同步）
- **`saveSetting` 静态导入**：移除 SettingsPage 中两处冗余的 `await import('../utils/db')`（已静态导入），消除 vite 构建 `INEFFECTIVE_DYNAMIC_IMPORT` 警告

#### 验证
- TypeScript 严格类型检查 0 错误
- ESLint 对新增文件 0 错误
- Vite 生产构建成功，bundle 大小无显著增长
- 单元测试 31/33 通过；2 项 streak 测试因依赖硬编码日期 `2026-05-24`（今日 2026-06-16）失败，与本次改动无关

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