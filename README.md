# CoolReader Android

[![Build APK](https://github.com/YOUR_USERNAME/CoolReader_android/actions/workflows/build.yml/badge.svg)](https://github.com/YOUR_USERNAME/CoolReader_android/actions/workflows/build.yml)

A minimal EPUB reader built with **React 18 + TypeScript + Vite**, wrapped as a native Android app via **Capacitor 8**. The app uses **epubjs** for EPUB rendering and **IndexedDB** for all local persistence.

## Features

- 📚 Bookshelf with grid view, search, and sort (title / author / recent)
- 📖 Full EPUB rendering via epubjs (paginated & scrolled modes)
- 🎨 3 themes (light / dark / sepia) + custom theme editor with gradient presets
- 🔖 Bookmarks and highlights with color selection and notes
- 🔍 Full-text search across the current book
- 📊 Reading statistics (daily / weekly / monthly / total) with 14-day chart
- 🎯 Daily reading goal
- 📥 Import EPUB files directly in-app
- 🎞️ Page transition animations (fade / slide / blur-focus / slide-fade)
- 📝 Font, size, weight, line-height, and margin controls
- 🔄 WebDAV sync configuration
- 🤖 AI assistant panel (configurable API endpoint)
- 🎮 Bluetooth media key page-turn support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript |
| Bundler | Vite 8 |
| Mobile | Capacitor 8 (Android) |
| EPUB | epubjs 0.3 |
| Storage | IndexedDB |
| Lint | ESLint + typescript-eslint |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (browser preview)
npm run dev

# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

## Project Structure

```
src/
├── App.tsx              # Root component, routing
├── components/
│   ├── BookShelf.tsx    # Bookshelf grid with import FAB
│   ├── Library.tsx      # Home screen layout (shelf/stats/settings)
│   ├── Reader.tsx       # Full-screen EPUB reader
│   ├── SidebarNav.tsx   # Bottom tab navigation
│   ├── Sidebar.tsx      # TOC sidebar
│   ├── MarkersPanel.tsx # Bookmarks & highlights panel
│   ├── LayoutPanel.tsx  # Font/layout controls
│   ├── SelectionToolbar.tsx
│   ├── CustomThemePanel.tsx
│   ├── AIPanel.tsx
│   ├── StatsPage.tsx    # Reading statistics
│   └── SettingsPage.tsx  # App settings
├── hooks/
│   ├── useEpub.ts       # EPUB lifecycle & state
│   └── useSearch.ts     # Full-text search
├── utils/
│   ├── db.ts            # IndexedDB facade
│   ├── animation.ts     # Page transition animations
│   ├── customTheme.ts   # Custom theme CSS generation
│   ├── styles.ts        # Shared style utilities
│   └── webdav.ts        # WebDAV client
└── types/index.ts       # Shared TypeScript types
```

## Build APK

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

## CI / Release

Every push to `main` triggers a GitHub Actions workflow that:
1. Runs TypeScript check
2. Builds web assets
3. Syncs to Android
4. Builds debug APK
5. Uploads the APK as a build artifact

Pushing a tag like `v1.0.0` additionally creates a GitHub Release with the APK attached.

### Download latest APK

1. Go to [Actions](https://github.com/YOUR_USERNAME/CoolReader_android/actions)
2. Click the latest successful workflow run
3. Download the `coolreader-debug` artifact
4. Install `app-debug.apk` on your Android device
