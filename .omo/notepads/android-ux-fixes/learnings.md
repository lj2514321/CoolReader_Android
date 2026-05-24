# Android UX Fixes — Learned Things

## useKeyboard hook (visualViewport API)

- window.visualViewport gives accurate keyboard height vs window.innerHeight or \esize\ event
- keyboardHeight = initialViewportHeight - currentViewportHeight (positive when keyboard open)
- isKeyboardVisible = keyboardHeight > 100 (100px threshold distinguishes keyboard from browser chrome)
- Rotation detection: compare aspect ratio (width/height) before/after — if delta > 5%, reset baseline
- Must use refs for initialHeight and aspectRef to avoid stale closures in event handler
- Fallback: if visualViewport is null, return keyboardHeight: 0, isKeyboardVisible: false

## font-size: 16px input zoom prevention

- iOS and Android browsers auto-zoom when an input field has font-size < 16px
- Fix: globally set \input, textarea, select { font-size: 16px }\ in index.html <style>
- This is a baseline fix that applies before any component renders — no specificity fights
- Works for AIPanel input, Settings inputs, and any future input element

## Keyboard avoidance pattern (for AIPanel / Settings)

- When keyboard opens, panels should set \ottom: keyboardHeight\ to avoid overlap
- The hook returns isKeyboardVisible flag so panels can also animate/transition smoothly
- Rotation must reset baseline so keyboardHeight doesn't stay artificially high after rotation

## NoteDialog Promise-based modal (this session)

- replace `prompt()` in useEpub.ts:427 with `showNoteDialog()` async call
- NoteDialog uses React Portal + CustomEvent communication pattern:
  - `showNoteDialog()` fires a CustomEvent 'note-dialog-open' and returns a Promise
  - NoteDialog component listens for the event, shows the modal, resolves on confirm/cancel
  - Module-level `resolvePromise` / `currentResolve` holds the pending resolver
- Dark glass style: background rgba(15,12,41,0.92), backdropFilter blur(24px), border-radius 16
- Purple gradient confirm button: linear-gradient(135deg, #6366f1, #a855f7)
- Empty confirm = null (no note stored), cancel = null — both treated as optional note
- NoteDialog mounted in App.tsx Reader branch so it's always available during reading

## Immersive Mode (this session)

### MainActivity.java
- Uses `WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())` from AndroidX core
- `hide(WindowInsetsCompat.Type.systemBars())` hides both status bar and navigation bar
- `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE` allows brief reveal on swipe then re-hides
- `show(WindowInsetsCompat.Type.systemBars())` restores both bars

### Capacitor Bridge
- Methods on BridgeActivity (or any Activity extending BridgeActivity) are automatically exposed to JS via `Plugins.MainActivity.methodName()`
- No need for `@CapacitorPlugin` annotation on the activity itself
- From web: `Plugins.MainActivity.setImmersiveMode(true/false)`

### StatusBar Plugin
- `@capacitor/status-bar` plugin provides `StatusBar.hide()` / `StatusBar.show()`
- Works in parallel with WindowInsetsController for full immersive experience
- Imported in App.tsx and called in handleBack() for restore

### Flow
- Enter reading: StatusBar.hide() + setImmersiveMode(true) called in App.tsx handleBack (restore on exit)
- Exit reading: `handleBack()` in App.tsx calls `StatusBar.show()` + `Plugins.MainActivity.setImmersiveMode(false)`

### Key Files
- `android/app/src/main/java/com/coolreader/app/MainActivity.java` — setImmersiveMode method
- `src/App.tsx` — handleBack calls restore; Reader useEffect cleaned up
- `package.json` — @capacitor/status-bar added

## Hardware Back Button Handling (this session)

### Capacitor App Plugin
- `@capacitor/app` plugin provides `App.addListener('backButton', handler)` for Android hardware back button
- Listening for 'backButton' event disables the default back button behavior automatically
- Must call `App.exitApp()` explicitly if you want to close the app
- Returns a Promise that resolves to a listener handle with `.remove()` method

### Hierarchical Back Button Strategy
- **Reader** (readerPath non-null): `onBackButton` prop → calls `handleBack()` (returns to bookshelf)
  - Reader has its own `App.addListener` that first checks `hasOpenPanel()` — if any panel is open (showSidebar, showAI, showSearch, showMarkers, showAa, showCustomTheme), it closes them via `closeAllPanels()`
  - If no panel open, calls `onBackButton()` → `handleBack()` → `epub.destroy()` + `setReaderPath(null)`
- **Settings detail view** (settingView !== null in SettingsPage): `App.addListener` checks `settingView !== null`, calls `popDetail()` to return to settings list
- **Settings list view**: passes `onBackButton` up to Library, which calls `App.exitApp()` to exit
- **Bookshelf main page**: Library's `App.addListener` calls `App.exitApp()` for app exit

### Key Files Modified
- `src/App.tsx`: Added `App.addListener` at root level, passes `onBackButton={handleBack}` to Reader, `onBackButton={() => App.exitApp()}` to Library
- `src/components/Reader.tsx`: Added `onBackButton` prop, `closeAllPanels()`, `hasOpenPanel()`, `App.addListener('backButton')` for panel-aware back handling
- `src/components/SettingsPage.tsx`: Added `onBackButton` prop, `App.addListener('backButton')` for detail-view-aware back handling
- `src/components/Library.tsx`: Added `onBackButton` prop, `App.addListener('backButton')` to exit app when on bookshelf

### Panel State Variables in Reader
- `showAI`, `showSidebar`, `showAa`, `showMarkers`, `showSearch`, `showCustomTheme`
- `hasOpenPanel()` returns true if any panel is open
- `closeAllPanels()` sets all panel states to false

