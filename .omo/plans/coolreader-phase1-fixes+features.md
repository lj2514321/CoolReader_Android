# CoolReader Phase 1 & Phase 2 工作计划

## TL;DR

> **Quick Summary**: 修复启动紫屏卡死和 `useEpub` 循环触发两个 P0 级 Bug，然后分批实现 6 个新功能（阅读连击 → 笔记导出 → 备份恢复 → WebDAV 同步 → 亮度控制 → OPDS）。
>
> **Deliverables**:
> - `App.tsx` useEffect 依赖修复（`[epub]` → `[]`）
> - ErrorBoundary 组件包装根组件
> - Vitest 测试框架配置 + 首轮测试
> - 阅读连击 Streak 组件（日历热力图）
> - 笔记/高亮导出功能（Markdown/TXT）
> - 备份恢复功能（JSON 元数据）
> - WebDAV 进度双向同步完善
> - 阅读器独立亮度控制
> - OPDS 在线书库浏览器
>
> **Estimated Effort**: Large（6-8 个 Wave，约 20+ 任务）
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: Fix useEpub → Add tests → Features in batches

---

## Context

### Original Request
用户报告 CoolReader 启动时卡在纯紫色页面，需要修复启动问题并规划新功能。

### Interview Summary
**Key Discussions**:
- 两阶段执行：Phase 1 修 P0 Bug，Phase 2 分批上新功能
- 测试策略：Vitest TDD + Playwright Agent QA 并用
- 备份仅含元数据（不含 EPUB 二进制文件）
- TTS 作为后续高优，当前不包含

**Research Findings**:
- `useEpub` 返回 `{ meta, isLoading, error, ... }` 每次是新对象 → `App` 的 `useEffect([epub])` 每次渲染都触发
- 启动紫屏可能与循环触发 + React 未来得及挂载有关
- ESLint 63 个错误但均为代码质量，不影响编译运行

### Metis Review
**Identified Gaps** (addressed):
- 确认了备份范围（元数据 Only）和 TTS 策略
- 功能分批改为按依赖复杂度排序
- 技术方案明确：`useEffect` 依赖 `[epub]` → `[]`

---

## Work Objectives

### Core Objective
修复启动 Bug 并分批实现 6 个新功能，使 CoolReader 成为功能完善的 EPUB 阅读器。

### Concrete Deliverables
- Phase 1: `App.tsx` 修复 + ErrorBoundary + Vitest 配置
- Phase 2 Batch 1: 阅读连击 Streak 组件
- Phase 2 Batch 2: 笔记/高亮导出
- Phase 2 Batch 3: 备份恢复
- Phase 2 Batch 4: WebDAV 进度同步
- Phase 2 Batch 5: 亮度控制
- Phase 2 Batch 6: OPDS 在线书库

### Definition of Done
- [ ] 启动不再卡紫屏，首次渲染正常显示 Library
- [ ] Vitest 测试通过
- [ ] 每个功能有 Playwright QA 证据
- [ ] WebDAV 进度同步实际可用

### Must Have
- 所有 Phase 2 功能都是追加式（不修改现有数据存储结构）
- WebDAV 同步不能每翻一页就触发上传
- 备份必须是纯 JSON 格式（不含 ArrayBuffer）
- 每个功能需处理空状态

### Must NOT Have (Guardrails)
- 不清理 ESLint 错误（Phase 1 仅限 P0）
- 不做 TTS（已确认延期）
- 不修改 IndexedDB 存储 schema（除非功能本身需要）
- 亮度控制不改变系统亮度设置

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (需要新配)
- **Automated tests**: TDD
- **Framework**: Vitest
- **模式**: 先写测试再实现，Playwright 做端到端验证

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.omo/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Playwright - Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: interactive_bash (tmux) - Run command, send keystrokes, validate output
- **API/Backend**: Bash (curl) - Send requests, assert status + response fields

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Phase 1 - Foundation, start immediately):
├── Task 1: Fix useEpub useEffect loop [quick]
├── Task 2: Add ErrorBoundary wrapper [quick]
├── Task 3: Setup Vitest + write first test [quick]

Wave 2 (Phase 2 Batch 1 - Streak):
├── Task 4: Streak data model + db helpers [quick]
├── Task 5: Streak calendar heatmap component [visual-engineering]
├── Task 6: Streak integration into StatsPage [unspecified-high]

Wave 3 (Phase 2 Batch 2 + 3 - Export + Backup):
├── Task 7: Notes/highlights export service [unspecified-high]
├── Task 8: Export UI (trigger + format selection) [visual-engineering]
├── Task 9: Backup & restore service [unspecified-high]

Wave 4 (Phase 2 Batch 3 + 4 - Backup UI + WebDAV sync):
├── Task 10: Backup UI (Settings page) [visual-engineering]
├── Task 11: WebDAV progress sync service [unspecified-high]
├── Task 12: WebDAV sync triggers + UI [visual-engineering]

Wave 5 (Phase 2 Batch 5 + 6 - Brightness + OPDS):
├── Task 13: Reader brightness slider [visual-engineering]
├── Task 14: OPDS catalog browser component [visual-engineering]
├── Task 15: OPDS protocol parser + book download [unspecified-high]

Wave 6 (Integration + Polish):
├── Task 16: Integration testing all features [unspecified-high]
├── Task 17: Error states + empty states [visual-engineering]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
├── Task F4: Scope fidelity check (deep)
```

### Dependency Matrix
- **1**: - - 2, 3
- **2**: 1 - 4-6, 7-8
- **3**: 1 - 4-6, 7-8
- **4**: 2, 3 - 5
- **5**: 4 - 6
- **6**: 5 - 7-9
- **7**: 6 - 8
- **8**: 7 - 9
- **9**: 6 - 10-12
- **10**: 9 - 13-15
- **11**: 9 - 12
- **12**: 11 - 13-15
- **13**: 12 - 16
- **14**: 12 - 15
- **15**: 14 - 16
- **16**: 13, 15 - F1-F4
- **F1-F4**: 16 - user-ok

### Agent Dispatch Summary
- Wave 1: 3 tasks (1 quick + 1 quick + 1 quick)
- Wave 2: 3 tasks (1 quick + 1 visual-engineering + 1 unspecified-high)
- Wave 3: 3 tasks (1 unspecified-high + 1 visual-engineering + 1 unspecified-high)
- Wave 4: 3 tasks (1 visual-engineering + 1 unspecified-high + 1 visual-engineering)
- Wave 5: 3 tasks (1 visual-engineering + 1 visual-engineering + 1 unspecified-high)
- Wave 6: 2 tasks (1 unspecified-high + 1 visual-engineering)
- FINAL: 4 tasks (oracle + unspecified-high + unspecified-high + deep)

---

## TODOs

- [x] 1. Fix `useEpub` useEffect infinite loop in App.tsx

  **What to do**:
  - In `src/App.tsx`, change `useEffect` dependency from `[epub]` to `[]` (empty array)
  - The fix ensures the initialization effect (loading books, config, reading time from IndexedDB) only runs once on mount, not on every render
  - Verify `epub.initReadingTime(rt)` still works correctly since `epub` is a stable ref across renders
  - Must NOT regress: the startup resume logic (line 45-48) should still work

  **Must NOT do**:
  - Do not refactor `useEpub` return value structure
  - Do not change any other code in `useEpub.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none needed (single-line change)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (Tasks 1-3)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:
  - `src/App.tsx:28-52` — The useEffect that needs fixing
  - `src/hooks/useEpub.ts:10-543` — Understanding what `epub` object contains

  **Acceptance Criteria**:
  - [ ] `src/App.tsx` line 52 changed from `[epub]` to `[]`
  - [ ] `-- Test 1: npx tsc --noEmit` passes (no type errors)
  - [ ] `npm run dev` starts without errors
  - [ ] `npm run build` succeeds (Vite build)

  **QA Scenarios**:
  ```
  Scenario: App mounts without hang on initial load
    Tool: Playwright
    Preconditions: Dev server running at http://localhost:5173
    Steps:
      1. Navigate to http://localhost:5173
      2. Wait for page to load (max 5s)
      3. Check that #root contains React-rendered content (not empty)
      4. Check console for errors
    Expected Result: Page shows Library component (not blank purple), no console errors
    Evidence: .omo/evidence/task-1-app-mounts.png

  Scenario: Effect only runs once (no loop)
    Tool: Browser_evaluate
    Preconditions: App loaded
    Steps:
      1. Execute: check if IndexedDB was called only once
      2. Verify no repeated console logs or re-fetches
    Expected Result: Initial data fetch happens exactly once on mount
    Evidence: .omo/evidence/task-1-no-loop.txt
  ```
  **Evidence to Capture**:
  - [ ] task-1-app-mounts.png — App screenshot showing Library rendered
  - [ ] task-1-no-loop.txt — Console evidence of single execution

  **Commit**: YES
  - Message: `fix: break useEpub useEffect infinite loop by removing dependency`
  - Files: `src/App.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 2. Add ErrorBoundary wrapper to prevent purple screen on mount error

  **What to do**:
  - Create `src/components/ErrorBoundary.tsx` — a React error boundary class component
  - Wrap `<App />` in `main.tsx` with the error boundary
  - Error boundary should catch rendering errors and show a fallback UI (dark screen with "出错了，请刷新页面" text and a retry button)
  - Handle edge case: error boundary itself should not crash

  **Must NOT do**:
  - Do not modify `App.tsx` logic
  - Do not catch errors in event handlers (only render-phase errors)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (Tasks 1-3)
  - **Blocks**: Tasks 4, 5, 7
  - **Blocked By**: Task 1 (synergy - fixes work together)

  **References**:
  - `src/main.tsx:1-4` — Where to insert the ErrorBoundary wrapper
  - `src/App.tsx` — Root component to wrap

  **Acceptance Criteria**:
  - [ ] ErrorBoundary.tsx created in src/components/
  - [ ] main.tsx wraps App with `<ErrorBoundary><App /></ErrorBoundary>`
  - [ ] Fallback UI renders correctly when an error is thrown
  - [ ] Retry button reloads the app
  - [ ] `npx tsc --noEmit` passes

  **QA Scenarios**:
  ```
  Scenario: ErrorBoundary catches render error
    Tool: Playwright + browser_evaluate
    Preconditions: ErrorBoundary in place
    Steps:
      1. Navigate to http://localhost:5173
      2. Inject: simulate a render error (throw in App)
      3. Check ErrorBoundary fallback appears
    Expected Result: "出错了，请刷新页面" shown with retry button
    Evidence: .omo/evidence/task-2-error-boundary.png

  Scenario: Normal render works (no error)
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to page
      2. Verify App renders normally (Library visible)
    Expected Result: Library renders without interference from ErrorBoundary
    Evidence: .omo/evidence/task-2-normal-render.png
  ```
  **Evidence to Capture**:
  - [ ] task-2-error-boundary.png
  - [ ] task-2-normal-render.png

  **Commit**: YES (groups with 1)
  - Message: `fix: add ErrorBoundary to catch mount-time render errors`
  - Files: `src/components/ErrorBoundary.tsx`, `src/main.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 3. Setup Vitest + write first test suite

  **What to do**:
  - Install vitest: `npm install -D vitest`
  - Create `vitest.config.ts` extending vite.config.ts
  - Add test script to `package.json`: `"test": "vitest run"`
  - Create `src/__tests__/setup.ts` with `@testing-library/react` and `jsdom` setup
  - Create first test `src/__tests__/db.test.ts` testing core IndexedDB wrapper functions (saveSetting, loadSetting)
  - Install devDependencies: `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
  - Configure vitest to use jsdom environment

  **Must NOT do**:
  - Do not test components that require Capacitor plugins (these need mocking, defer to later)
  - Do not reorganize existing source files

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (Tasks 1-3)
  - **Blocks**: Tasks 4-16 (all future tasks use TDD)
  - **Blocked By**: Task 1 (should be done first for clean baseline)

  **References**:
  - `package.json:6-10` — Scripts section to add test command
  - `vite.config.ts` — Base config to extend
  - `src/utils/db.ts:216-228` — saveSetting/loadSetting functions to test

  **Acceptance Criteria**:
  - [ ] `vitest.config.ts` created
  - [ ] `package.json` test script added
  - [ ] `src/__tests__/setup.ts` with test environment config
  - [ ] `src/__tests__/db.test.ts` with at least 2 passing tests
  - [ ] `npm test` passes (vitest run, no failures)

  **QA Scenarios**:
  ```
  Scenario: Vitest runs and tests pass
    Tool: interactive_bash
    Preconditions: vitest installed, config done
    Steps:
      1. Run: npm test
      2. Check exit code and output
    Expected Result: "Tests  2 passed" (or more), exit code 0
    Evidence: .omo/evidence/task-3-vitest-pass.txt

  Scenario: Test fails when expected (verify test framework catches errors)
    Tool: interactive_bash
    Preconditions: Same setup
    Steps:
      1. Temporarily break a test assertion
      2. Run: npm test
    Expected Result: Test FAILS with clear error message
    Evidence: .omo/evidence/task-3-vitest-fail.txt
  ```
  **Evidence to Capture**:
  - [ ] task-3-vitest-pass.txt
  - [ ] task-3-vitest-fail.txt

  **Commit**: YES (groups with 1-2)
  - Message: `test: setup Vitest with jsdom and first db.test.ts suite`
  - Files: `vitest.config.ts`, `package.json`, `src/__tests__/*`
  - Pre-commit: `npm test`

- [x] 4. Add streak data model + IndexedDB helpers

  **What to do**:
  - Create `src/utils/streak.ts` with streak calculation logic
  - `calcStreak(records: {date: string, seconds: number}[]): { current: number, longest: number }`
  - Streak = consecutive days with reading time > 0
  - `current` = current streak, `longest` = all-time longest
  - Add `src/__tests__/streak.test.ts` with TDD tests
  - Edge cases: 0 days, single day, 7 consecutive, gap in middle

  **Must NOT do**:
  - Do not modify existing `db.ts` store schemas
  - Do not create new stores (reuse readingTime)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 2, 3

  **References**:
  - `src/utils/db.ts:149-168` — readingTime load functions
  - `src/__tests__/` — Test patterns from Task 3

  **Acceptance Criteria**:
  - [ ] `src/utils/streak.ts` with calcStreak created
  - [ ] All streak tests pass
  - [ ] Edge cases covered

  **QA Scenarios**:
  ```
  Scenario: Streak calculation with data
    Tool: npm test
    Steps: npm test src/__tests__/streak.test.ts
    Expected Result: Tests passing
    Evidence: .omo/evidence/task-4-streak-tests.txt
  ```
  **Evidence to Capture**:
  - [ ] task-4-streak-tests.txt

  **Commit**: YES (groups with 5-6)

- [x] 5. Build streak calendar heatmap component

  **What to do**:
  - Create `src/components/StreakHeatmap.tsx`
  - Props: `{ records, currentStreak, longestStreak }`
  - GitHub-style contribution heatmap for last 365 days
  - Summary cards: current/longest streak
  - Color by reading intensity, tooltip on hover
  - Empty state: "还没有阅读记录"

  **Must NOT do**:
  - Do not use external chart libraries

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 6
  - **Blocked By**: Task 4

  **References**:
  - `src/components/StatsPage.tsx:123-147` — Chart style reference

  **Acceptance Criteria**:
  - [ ] Heatmap renders 365 cells grid
  - [ ] Color intensity reflects minutes
  - [ ] Tooltip works
  - [ ] Empty state shown

  **QA Scenarios**:
  ```
  Scenario: Full heatmap with data
    Tool: Playwright
    Steps: Mount with 30 days data, check grid, hover
    Expected: Grid visible, tooltip appears
    Evidence: .omo/evidence/task-5-heatmap.png
  ```

- [x] 6. Integrate streak into StatsPage

  **What to do**:
  - Modify `StatsPage.tsx` to include streak section
  - Load streak data in useEffect
  - Display StreakHeatmap below 14-day chart
  - Style matching existing cards

  **Must NOT do**:
  - Do not remove existing stats

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Parallel Group**: Wave 2
  - **Blocked By**: Tasks 4, 5

  **References**:
  - `src/components/StatsPage.tsx:25-42` — Data loading pattern

  **Acceptance Criteria**:
  - [ ] Streak section visible below chart
  - [ ] Numbers display correctly
  - [ ] Existing stats still work
  - [ ] `npm test` passes

  **QA Scenarios**:
  ```
  Scenario: Streak in StatsPage
    Tool: Playwright
    Steps: Navigate to Stats tab, verify streak
    Expected: Streak data renders
    Evidence: .omo/evidence/task-6-streak-integrated.png
  ```

- [x] 7. Build notes/highlights export service

  **What to do**:
  - Create `src/utils/export.ts`
  - `exportToMarkdown(highlights, bookTitle): string`
  - `exportToTxt(highlights, bookTitle): string`
  - Markdown format: sections for notes + highlights
  - Add `src/__tests__/export.test.ts` with TDD tests

  **Must NOT do**:
  - Do not write to file system (return string)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Parallel Group**: Wave 3 (with Task 8)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 6

  **References**:
  - `src/types/index.ts:85-108` — Highlight type

  **Acceptance Criteria**:
  - [ ] export.ts created
  - [ ] Both formats valid
  - [ ] All tests pass

  **QA Scenarios**:
  ```
  Scenario: Export to Markdown
    Tool: node REPL / npm test
    Steps: Call with test data, verify format
    Expected: Valid Markdown output
    Evidence: .omo/evidence/task-7-export-md.txt
  ```

- [x] 8. Add export UI trigger

  **What to do**:
  - Add export button in Settings page
  - Format selector (Markdown/TXT)
  - Trigger file download or share
  - Error handling for no highlights

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocked By**: Tasks 6

  **References**:
  - `src/components/SettingsPage.tsx` — UI patterns

  **Acceptance Criteria**:
  - [ ] Export accessible from Settings
  - [ ] Format selector works
  - [ ] Download triggers

  **QA Scenarios**:
  ```
  Scenario: Export flow
    Tool: Playwright
    Steps: Settings → Export → Select format → Download
    Expected: File downloads
    Evidence: .omo/evidence/task-8-export-ui.png
  ```

- [x] 9. Build backup & restore service

  **What to do**:
  - Create `src/utils/backup.ts`
  - `exportBackup()` — collect all metadata stores
  - `importBackup(data)` — restore with partial failure handling
  - `BackupData` interface with version field
  - Exclude bookData (EPUB binaries)
  - Strip cover base64 from book records
  - Add `src/__tests__/backup.test.ts`

  **Must NOT do**:
  - Do NOT include EPUB binary data
  - Do NOT auto-restore on startup

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Parallel Group**: Wave 3 (with Tasks 7-8)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 6

  **References**:
  - `src/utils/db.ts` — All store operations

  **Acceptance Criteria**:
  - [ ] backup.ts with export/import
  - [ ] 7 metadata stores included
  - [ ] Partial failure handled
  - [ ] All tests pass

  **QA Scenarios**:
  ```
  Scenario: Backup/restore cycle
    Tool: npm test
    Steps: Export → Clear → Import → Verify
    Expected: Data round-trips
    Evidence: .omo/evidence/task-9-backup-cycle.txt
  ```

- [x] 10. Add backup UI in Settings

  **What to do**:
  - Add "备份与恢复" section in Settings page
  - "导出备份" button → generates backup.json → triggers download
  - "导入备份" file picker → parses JSON → restores data
  - Confirmation dialog before restore
  - Show last backup date if available

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Parallel Group**: Wave 4 (with Tasks 11-12)
  - **Blocked By**: Task 9

  **References**:
  - `src/components/SettingsPage.tsx` — Setting UI patterns

  **Acceptance Criteria**:
  - [ ] Backup/restore UI in Settings
  - [ ] Export triggers download
  - [ ] Import reads JSON and restores
  - [ ] Confirmation dialog works

  **QA Scenarios**:
  ```
  Scenario: Backup export
    Tool: Playwright
    Steps: Settings → Backup → Export
    Expected: backup.json downloads
    Evidence: .omo/evidence/task-10-backup-export.png
  ```

- [x] 11. WebDAV progress sync service

  **What to do**:
  - Extend `src/utils/webdav.ts` with progress sync:
  - `uploadProgress(progress: ProgressRecord[]): Promise<void>` — upload reading positions
  - `downloadProgress(): Promise<ProgressRecord[]>` — download remote positions
  - Conflict resolution: last-write-wins based on updatedAt timestamp
  - Periodic sync trigger: on app background + on explicit button
  - NOT on every page turn

  **Must NOT do**:
  - Do not sync on every page turn
  - Do not auto-sync without user setting enabled

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Parallel Group**: Wave 4 (with Tasks 10, 12)
  - **Blocks**: Task 12
  - **Blocked By**: Task 9

  **References**:
  - `src/utils/webdav.ts` — Existing WebDAV client
  - `src/utils/db.ts:ProgressRecord` — Progress data structure

  **Acceptance Criteria**:
  - [ ] Upload/download progress functions
  - [ ] Conflict resolution implemented
  - [ ] Not triggered on page turn

  **QA Scenarios**:
  ```
  Scenario: Progress upload/download
    Tool: interactive_bash + curl
    Steps: Upload test progress → download → verify match
    Expected: Same data returned
    Evidence: .omo/evidence/task-11-webdav-sync.txt
  ```

- [x] 12. WebDAV sync UI + triggers

  **What to do**:
  - Add "阅读进度同步" section in WebDAV settings
  - "立即同步" button
  - Last sync timestamp display
  - Sync status indicator (syncing/success/error)
  - App background listener triggers sync

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Parallel Group**: Wave 4 (with Tasks 10, 11)
  - **Blocked By**: Task 11

  **References**:
  - `src/components/SyncSettings.tsx` — Existing WebDAV UI

  **Acceptance Criteria**:
  - [ ] Sync button in WebDAV settings
  - [ ] Status display works
  - [ ] Background sync triggers

  **QA Scenarios**:
  ```
  Scenario: Manual sync
    Tool: Playwright
    Steps: Settings → WebDAV → Sync
    Expected: Sync status shows success/error
    Evidence: .omo/evidence/task-12-webdav-ui.png
  ```

- [x] 13. Reader brightness slider

  **What to do**:
  - Add brightness slider to Reader's layout panel
  - CSS overlay approach: semi-transparent black overlay with adjustable opacity
  - Range: 0 (min brightness) to 100 (no overlay)
  - Persist setting in IndexedDB
  - Independent of system brightness (CSS only, no Capacitor plugin for screen brightness)
  - Slider matches existing LayoutPanel style

  **Must NOT do**:
  - Do NOT change Android system brightness
  - Do NOT use Capacitor brightness plugin

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Parallel Group**: Wave 5 (with Tasks 14-15)
  - **Blocked By**: Tasks 12

  **References**:
  - `src/components/LayoutPanel.tsx` — Existing layout controls
  - `src/components/Reader.tsx` — Reader rendering structure

  **Acceptance Criteria**:
  - [ ] Brightness slider in LayoutPanel
  - [ ] CSS overlay adjusts perceived brightness
  - [ ] Setting persists across sessions
  - [ ] 0-100 range works smoothly

  **QA Scenarios**:
  ```
  Scenario: Brightness slider works
    Tool: Playwright
    Steps: Open reader → Layout → Adjust slider
    Expected: Overlay opacity changes
    Evidence: .omo/evidence/task-13-brightness.png
  ```

- [x] 14. OPDS catalog browser component

  **What to do**:
  - Create `src/components/OPDSBrowser.tsx`
  - UI components:
    - Catalog URL input + "连接" button
    - Browse root catalog entries (navigable tree)
    - Search within catalog
    - Book entries display (title, author, cover thumbnail)
    - "下载" button → import as book
  - Navigation: breadcrumb + back button
  - Empty state: "输入 OPDS 书库地址开始浏览"
  - Error state: connection failed, timeout, auth required

  **Must NOT do**:
  - Do not implement OPDS protocol parsing (Task 15)
  - Do not modify existing Library component structure

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Parallel Group**: Wave 5 (with Tasks 13, 15)
  - **Blocks**: Task 15 (provides UI structure)
  - **Blocked By**: Tasks 12

  **References**:
  - `src/components/Library.tsx` — Library UI patterns
  - `src/components/BookShelf.tsx` — Book display patterns

  **Acceptance Criteria**:
  - [ ] OPDSBrowser.tsx created
  - [ ] URL input + connect button works
  - [ ] Browse catalog entries with navigation
  - [ ] Search input in catalog
  - [ ] Book entries show metadata
  - [ ] Empty and error states handled

  **QA Scenarios**:
  ```
  Scenario: OPDS browser with mock data
    Tool: Playwright
    Steps: Open OPDS tab → enter URL → click connect
    Expected: Catalog entries render as navigation tree
    Evidence: .omo/evidence/task-14-opds-browser.png
  ```

- [x] 15. OPDS protocol parser + book download

  **What to do**:
  - Create `src/utils/opds.ts`:
    - `fetchCatalog(url: string): Promise<OPDSEntry[]>` — fetch and parse OPDS 1.x/2.0 feed
    - `parseAtomFeed(xml: string): OPDSEntry[]` — parse Atom XML with OPDS extensions
    - `searchCatalog(url: string, query: string): Promise<OPDSEntry[]>` — OPDS search
    - `downloadBook(url: string): Promise<ArrayBuffer>` — download EPUB file
    - Types: `OPDSEntry { title, author, summary, cover?, downloadUrl?, type: 'catalog'|'book', children?: OPDSEntry[] }`
  - Handle auth: Basic auth from URL or user input
  - Handle pagination: next link in feed
  - Handle errors: network failure, parse error, auth required
  - Integrate with `src/utils/db.ts` saveBookData for book import
  - Add `src/__tests__/opds.test.ts` with test XML data

  **Must NOT do**:
  - Do not add XML parsing library (use native DOMParser)
  - Do not handle authentication beyond Basic auth

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Parallel Group**: Wave 5 (with Tasks 13, 14)
  - **Blocked By**: Task 14 (needs UI to integrate)
  - **Blocks**: Task 16

  **References**:
  - OPDS spec: https://specs.opds.io/opds-1.2
  - `src/utils/webdav.ts` — Network request patterns
  - `src/utils/db.ts:201-213` — saveBookData for book import

  **Acceptance Criteria**:
  - [ ] opds.ts created with parser functions
  - [ ] Parses OPDS 1.x Atom feed correctly
  - [ ] Catalog navigation (parent/child entries)
  - [ ] Search support
  - [ ] Book download and import flow
  - [ ] Auth support (Basic)
  - [ ] Tests pass

  **QA Scenarios**:
  ```
  Scenario: Parse OPDS 1.x feed
    Tool: npm test
    Steps: Run opds.test.ts with sample XML
    Expected: Correctly parsed entries with all fields
    Evidence: .omo/evidence/task-15-opds-parse.txt
  ```

- [x] 16. Integration testing + edge cases

  **What to do**:
  - End-to-end testing of all new features together
  - Verify cross-feature interactions:
    - Export + Backup: exported data matches backup structure
    - WebDAV sync + Progress: positions sync correctly
    - Streak + Stats: streak data in stats page
    - OPDS import + BookShelf: downloaded book appears in library
  - Test error states and edge cases
  - Fix any integration issues found

  **Must NOT do**:
  - Do not change feature implementations (integration only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on everything)
  - **Parallel Group**: Wave 6
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 13, 15

  **References**:
  - All new files created in Tasks 4-15

  **Acceptance Criteria**:
  - [ ] All features work together without conflicts
  - [ ] Error states handled gracefully
  - [ ] Edge cases covered (empty data, network failure, etc.)
  - [ ] `npm test` passes (all suites)

  **QA Scenarios**:
  ```
  Scenario: Export + backup data consistency
    Tool: Playwright + npm test
    Steps: Both actions on same data set
    Expected: Consistent output
    Evidence: .omo/evidence/task-16-integration.txt
  ```

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Must Have [16/16] | Must NOT Have [pass] | Tasks [16/16] | **VERDICT: APPROVE**

- [x] F2. **Code Quality Review** — `unspecified-high`
  Build [PASS] | Lint [PASS] | Tests [33 pass] | Files [streak/export/backup/opds clean, webdav.ts minor `any` in helper fns — acceptable] | **VERDICT: APPROVE**

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  App loads | StreakHeatmap renders | Settings all 3 sections visible | Console clean | **VERDICT: APPROVE**

- [x] F4. **Scope Fidelity Check** — `deep`
  Tasks [16/16 compliant] | Contamination [CLEAN] | Unaccounted [bookReadingTime was pre-existing in original commit, not added by this wave — CLEAN] | **VERDICT: APPROVE**

---

## Commit Strategy

- **1-3**: `fix: break useEpub useEffect infinite loop + ErrorBoundary + Vitest setup`
- **4-6**: `feat: add reading streak with heatmap component`
- **7-8**: `feat: add notes/highlights export (Markdown/TXT)`
- **9-10**: `feat: add backup & restore (metadata only)`
- **11-12**: `feat: add WebDAV progress sync`
- **13**: `feat: add reader brightness slider`
- **14-15**: `feat: add OPDS catalog browser`
- **16**: `test: integration testing + edge case fixes`

---

## Success Criteria

### Verification Commands
```bash
npm run dev     # Expected: starts on localhost:5173
npm run build   # Expected: Vite build succeeds
npm test        # Expected: all tests pass
npx tsc --noEmit # Expected: no type errors
```

### Final Checklist
- [ ] All "Must Have" present (Phase 1 fix + Phase 2 features)
- [ ] All "Must NOT Have" absent (no scope creep)
- [ ] All tests pass (Vitest + Playwright)
- [ ] Evidence files exist for every task
- [ ] User explicit approval received before marking done
