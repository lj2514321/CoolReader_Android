# Android UX 体验修复计划

## TL;DR

> **Quick Summary**: 系统性地修复从 Electron 桌面端移植到 Android 移动端后产生的 17 个 UX/UI 体验问题，重点解决异形屏适配、返回键处理、键盘避让、触摸目标过小、手势交互等核心痛点。
>
> **Deliverables**:
> - 全局 Safe Area 适配 (notch/刘海/挖孔屏 + 手势导航条)
> - Android 物理返回键正确处理
> - 软键盘弹出时输入框自动避让
> - 自定义笔记输入弹窗替代 `prompt()`
> - Material Design 48dp 最小触摸目标
> - 滑动翻页手势 + 翻页点击区域重设计
> - 沉浸式全屏阅读模式
> - 加载状态指示器
> - 主题色彩一致性
> - CSS 兼容性加固
>
> **Estimated Effort**: Medium-Large (10-14 小时并行执行)
> **Parallel Execution**: YES — 4 waves + 1 final verification
> **Critical Path**: Wave 1 (Foundation) → Wave 2 (Reader) → Wave 3 (Components) → Wave 4 (Polish) → Final Wave

---

## Context

### Original Request
用户希望修复 CoolReader Android 在实机上的一系列体验问题，特别是"顶部和底部突出屏幕"（异形屏适配）。用户要求系统性排查移植过程导致的所有 Android 体验问题。

### Interview Summary
**Key Discussions**:
- 项目从 Electron 桌面端移植到 Android（Capacitor 8），大量交互模式仍是桌面思维
- 用户确认 17 个问题的分析报告准确，要求制定修复计划
- 重点关注：Safe Area、返回键、键盘、触摸目标、翻页手势

**User Decisions**:
- **测试设备**: 既有真机也有模拟器，灵活测试
- **沉浸模式**: 全自动隐藏（进入阅读自动隐藏，点击中央短暂显示，3 秒无操作重隐藏）
- **主题色常量**: 统一使用 `#0f0c29`（默认值确认）
- **滑动阈值**: 50px（默认值确认）
- **错误提示范围**: 仅关键错误显示给用户，非关键降级静默处理（默认值确认）

**Research Findings**:
- 无测试基础设施
- 所有 UI 通过 Android WebView 渲染
- `MainActivity.java` 只有基础 BridgeActivity，无自定义配置
- `capacitor.config.ts` 缺少 app-specific 设置
- 大量 `position: absolute` 布局未使用 `env(safe-area-*)`
- `prompt()` 在移动端体验极差
- 触摸目标普遍小于 48dp Android 推荐标准

### Metis Review
**Identified Gaps** (addressed):
- 设备碎片化测试需求 → 在计划中标注了测试设备矩阵，用户确认真机+模拟器均可测试
- 隐私合规/Play Store 要求 → 48dp 触摸目标作为非协商性任务
- 范围蔓延风险 → 明确 MUST NOT 列表
- 需要用户确认优先级 → 用户确认了沉浸模式行为、默认值等决策

---

## Work Objectives

### Core Objective
系统性地修复 CoolReader Android 从桌面端移植到移动端后产生的所有 Android 实机体验问题，使其在真机上达到可接受的阅读体验标准。

### Concrete Deliverables
- `index.html` — 全局 safe-area CSS + meta 标签
- `src/App.tsx` — 全局布局 + loading 状态
- `src/components/Reader.tsx` — 顶栏/底栏 safe area、翻页手势、点击区域
- `src/components/NoteDialog.tsx` — 新建的自定义 note 弹窗（替代 prompt）
- `src/components/LayoutPanel.tsx` — safe area 适配
- `src/components/MarkersPanel.tsx` — safe area 适配
- `src/components/Sidebar.tsx` — safe area 适配
- `src/components/AIPanel.tsx` — 键盘避让 + safe area
- `src/components/SelectionToolbar.tsx` — 触摸目标放大
- `src/components/BookShelf.tsx` — 网格 + 触摸目标改进
- `src/components/StatsPage.tsx` / `SettingsPage.tsx` — 触摸目标 + 键盘
- `src/hooks/useEpub.ts` — 替换 prompt()
- `capacitor.config.ts` — keyboard/statusBar 配置
- `android/.../MainActivity.java` — 返回键 + 沉浸模式
- `android/.../styles.xml` — 原生主题配置

### Definition of Done
- [ ] `env(safe-area-inset-*)` 应用于所有 `position: fixed/absolute` 的面板和栏
- [ ] Android 物理返回键在阅读页返回书架，在设置详情页返回列表
- [ ] 所有输入框在键盘弹出时自动可见（无遮挡）
- [ ] `prompt()` 被自定义 React 弹窗替代
- [ ] 所有可交互元素触摸目标 ≥ 44px（接近 48dp 推荐标准）
- [ ] 阅读页支持左右滑动翻页
- [ ] 翻页点击区域为左右各 30%（中间 40% 切换 UI）
- [ ] 阅读器进入时自动隐藏状态栏/导航栏
- [ ] 打开书籍和搜索索引构建时有 loading 指示
- [ ] 构建通过（`npm run build` + `npx tsc --noEmit`）
- [ ] 在 Android 真机/模拟器上运行无 JS 报错

### Must Have
- Safe Area 适配（顶部 notch + 底部手势导航条）
- Android 返回键正确处理
- 键盘弹出时输入框可见
- `prompt()` 替换
- 翻页手势（滑动）

### Must NOT Have (Guardrails)
- 不添加新功能（在线书城、笔记导出等）
- 不重构架构
- 不修改数据库（`src/utils/db.ts`）
- 不升级/更换依赖包版本（epubjs、capacitor 等）
- 不修改原生 Kotlin/Java 代码外的原生层（如 Gradle 配置）
- 不添加新的 npm 依赖（除非 Capacitor 官方插件）
- 不做非必要的大范围重构

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO
- **Framework**: N/A
- **Agent-Executed QA**: ALWAYS — 每个任务执行后通过 D8 模拟器或真机验证

### QA Policy
- **CSS/Safe Area**: 使用 Android Emulator with notch cutout 模拟器截图验证
- **交互/手势**: `interactive_bash` + ADB 命令模拟点击和滑动
- **React 组件**: 使用 Playwright 在 web 模式下验证渲染
- **键盘/输入**: ADB 模拟键盘弹出和输入

**注意**: 部分测试（Safe Area、沉浸模式、返回键）无法在浏览器中执行，需要在 Android 模拟器中验证。

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation + scaffolding, 7 tasks):
├── Task 1: Global safe-area CSS + Capacitor config [visual-engineering]
├── Task 2: NoteDialog component (replace prompt) [visual-engineering]
├── Task 3: Android back button handling [unspecified-high]
├── Task 4: Android immersive reading mode [unspecified-high]
├── Task 5: Keyboard avoidance CSS/mechanism [visual-engineering]
├── Task 6: Touch target 48dp sizing utilities [visual-engineering]
└── Task 7: Reader page-turn zone constants/shared styles [visual-engineering]

Wave 2 (After Wave 1 - Reader core fixes, 6 tasks):
├── Task 8: Reader top bar safe area + layout [visual-engineering]
├── Task 9: Reader bottom bar safe area + layout [visual-engineering]
├── Task 10: Reader swipe gesture support [visual-engineering]
├── Task 11: Reader click area redesign (30/40/30) [visual-engineering]
├── Task 12: Reader immersive mode integration [unspecified-high]
└── Task 13: Reader/book loading state indicator [visual-engineering]

Wave 3 (After Wave 2 - component panels, 6 tasks):
├── Task 14: LayoutPanel safe area + touch targets [visual-engineering]
├── Task 15: MarkersPanel safe area [visual-engineering]
├── Task 16: Sidebar safe area [visual-engineering]
├── Task 17: AIPanel keyboard avoidance + safe area [visual-engineering]
├── Task 18: SelectionToolbar touch targets [visual-engineering]
└── Task 19: BookShelf grid + touch target improvements [visual-engineering]

Wave 4 (After Wave 3 - polish + consistency, 5 tasks):
├── Task 20: Settings/Stats pages keyboard + touch targets [visual-engineering]
├── Task 21: Error handling improvements (visible to user) [unspecified-high]
├── Task 22: Theme consistency pass [visual-engineering]
├── Task 23: CSS compatibility hardening [visual-engineering]
└── Task 24: Final build verification + lint [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA on Android [unspecified-high]
└── Task F4: Scope fidelity check [deep]
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 8 → Task 14/17 → Task 20 → F1-F4 → user okay
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 7 (Wave 1)
```

### Dependency Matrix
- **Tasks 1-7 (Wave 1)**: No deps - can start immediately. Block: 8-19
- **Task 8**: Depends: 1, 5, 6, 7. Blocks: 14, 15, 16
- **Task 9**: Depends: 1, 5, 6, 7. Blocks: 14, 15, 17
- **Task 10**: Depends: 7. Blocks: none (independent feature)
- **Task 11**: Depends: 7. Blocks: none
- **Task 12**: Depends: 4. Blocks: none
- **Task 13**: Depends: none. Blocks: none (parallel with Wave 1)
- **Tasks 14-19 (Wave 3)**: Depends: 1, 5, 6, 7, 8, 9. Blocks: 20-24
- **Tasks 20-24 (Wave 4)**: Depends: 14-19. Blocks: F1-F4
- **F1-F4 (Final)**: Depends: 20-24. Blocks: user approval

### Agent Dispatch Summary
- **Wave 1**: 7 tasks — T1,T2,T5,T6,T7 → `visual-engineering`, T3,T4 → `unspecified-high`
- **Wave 2**: 6 tasks — T8,T9,T10,T11,T13 → `visual-engineering`, T12 → `unspecified-high`
- **Wave 3**: 6 tasks — T14-T19 → `visual-engineering`
- **Wave 4**: 5 tasks — T20,T22,T23 → `visual-engineering`, T21 → `unspecified-high`, T24 → `quick`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

### Wave 1 — 基础设施和配置 (7 任务并行)

- [x] 1. **全局 Safe Area CSS + Capacitor 配置**

  **What to do**:
  - `index.html`: 在 `#root` 上添加 `padding-bottom: env(safe-area-inset-bottom)`；确认 `viewport-fit=cover` 已存在
  - `index.html`: 将 `#root` safe-area CSS 改为全局应用策略：`padding-top: env(safe-area-inset-top)` + `padding-bottom: env(safe-area-inset-bottom)` + `padding-left: env(safe-area-inset-left)` + `padding-right: env(safe-area-inset-right)`
  - `index.html`: 添加 `env()` fallback 值适配旧 WebView
  - `capacitor.config.ts`: 添加 `android` 下 `adjustResize: true` 配置处理键盘弹出
  - 验证：构建通过，Safe Area CSS 正确注入

  **Must NOT do**:
  - 不要修改任何组件逻辑（只改全局 CSS 和配置）
  - 不要添加新的 npm 包

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 浏览器兼容性 + CSS 体验设计
  - **Skills**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-7)
  - **Blocks**: 8, 9, 14-19
  - **Blocked By**: None

  **References**:
  - `index.html` (当前 CSS reset 和 viewport 配置)
  - `capacitor.config.ts` (当前配置)
  - Android WebView 文档: `env(safe-area-inset-*)` CSS 环境变量

  **Acceptance Criteria**:
  - [ ] `index.html` 添加了完整的 safe-area CSS（上/下/左/右）
  - [ ] `capacitor.config.ts` 添加了 `adjustResize: true`
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: Safe Area CSS 正确注入
    Tool: Bash (read file)
    Preconditions: index.html exists
    Steps:
      1. grep safe-area-inset-top index.html → 确认包含 env() 调用
      2. grep safe-area-inset-bottom index.html → 确认包含 env() 调用
      3. grep adjustResize capacitor.config.ts → 确认配置存在
    Expected Result: 所有 3 个检查项都匹配
    Evidence: .omo/evidence/task-1-safe-area-css.txt

  Scenario: 构建通过
    Tool: Bash (npm run build)
    Preconditions: 依赖已安装
    Steps:
      1. npm run build
      2. grep "error" build output (exit code 0)
    Expected Result: 构建成功，无错误
    Evidence: .omo/evidence/task-1-build.txt
  ```

  **Commit**: YES
  - Message: `fix: add safe-area CSS foundation and Capacitor keyboard config`
  - Files: `index.html`, `capacitor.config.ts`

---

- [x] 2. **NoteDialog 组件（替代 prompt）**

  **What to do**:
  - 新建 `src/components/NoteDialog.tsx`
  - React 组件：受控 Modal，包含文本输入框 + 取消/确认按钮
  - 返回 Promise<string | null>，调用方式：`const note = await showNoteDialog()`
  - 保持现有 UI 风格（毛玻璃背景、紫色渐变主题、圆角）
  - 在 `useEpub.ts` 第 427 行用自定义弹窗替换 `prompt('输入笔记（可选）：')`
  - 确保高亮创建流程不受影响

  **Must NOT do**:
  - 不要添加额外状态管理库
  - 不要修改高亮创建的业务逻辑

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 移动端 UI 组件设计 + React 经验

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3-7)
  - **Blocks**: None (useEpub.ts 修改是独立的)
  - **Blocked By**: None

  **References**:
  - `src/hooks/useEpub.ts:427` — 当前 `prompt()` 调用处
  - `src/types/index.ts:Highlight` — Highlight 类型的 note 字段
  - `src/components/SelectionToolbar.tsx` — 现有 UI 风格参考
  - `src/utils/styles.ts:glass` — 毛玻璃样式常量

  **Acceptance Criteria**:
  - [ ] `src/components/NoteDialog.tsx` 创建
  - [ ] `useEpub.ts:427` 的 `prompt()` 被替换
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: NoteDialog 渲染和交互
    Tool: Playwright
    Preconditions: 打开图书，选中文本，点击高亮颜色
    Steps:
      1. 触发高亮创建 → NoteDialog 弹出
      2. 输入 "测试笔记" → 点击确认
      3. 检查 highlights 列表中包含笔记内容
    Expected Result: NoteDialog 显示，输入内容被保存
    Evidence: .omo/evidence/task-2-notedialog.png

  Scenario: NoteDialog 取消操作
    Tool: Playwright
    Preconditions: 同上
    Steps:
      1. NoteDialog 弹出 → 点击取消
      2. 检查高亮是否被创建（应不被创建或 note 为空）
    Expected Result: 高亮没有 note，流程正常继续
    Evidence: .omo/evidence/task-2-notedialog-cancel.png
  ```

  **Commit**: YES
  - Message: `fix: replace prompt() with custom NoteDialog component for mobile`
  - Files: `src/components/NoteDialog.tsx`, `src/hooks/useEpub.ts`

---

- [x] 3. **Android 物理返回键处理**

  **What to do**:
  - `android/app/src/main/java/com/coolreader/app/MainActivity.java`: 重写 `onBackPressed()` 方法
  - 或者使用 Capacitor `App` 插件的 `backButton` 事件监听
  - 在 `src/App.tsx` 中添加 `useEffect` 监听 Capacitor 的 `App.addListener('backButton', ...)`
  - 在阅读页（`readerPath` 非空）按返回 → 调用 `handleBack()` 回到书架
  - 当 Sidebar/搜索/AI面板/设置详情页打开时按返回 → 关闭面板而非退出 app
  - 在主书架页按返回 → 允许默认行为（退出 app 或最小化）

  **Must NOT do**:
  - 不要修改 Android 活动生命周期
  - 不要添加新的原生权限

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Android 原生开发经验 + Capacitor 事件系统理解

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-2, 4-7)
  - **Blocks**: 12
  - **Blocked By**: None

  **References**:
  - `android/app/src/main/java/com/coolreader/app/MainActivity.java` — 当前空实现
  - `src/App.tsx` — 根组件，handleBack 和路由逻辑
  - `src/components/Reader.tsx` — 阅读器组件（面板状态管理）
  - `src/components/SettingsPage.tsx:popDetail()` — 设置详情返回
  - Capacitor `@capacitor/app` 插件文档

  **Acceptance Criteria**:
  - [ ] `MainActivity.java` 或 App.tsx 中添加了返回键监听
  - [ ] 阅读页按返回 → 回到书架
  - [ ] 设置详情页按返回 → 回到设置列表
  - [ ] 主书架页按返回 → 允许退出 app

  **QA Scenarios**:
  ```
  Scenario: 阅读页返回键
    Tool: interactive_bash (ADB)
    Preconditions: Android 模拟器运行中，app 打开，在阅读页
    Steps:
      1. adb shell input keyevent KEYCODE_BACK
      2. 等待 1 秒
      3. ADB 截图
    Expected Result: 回到书架页（截图显示书架而非阅读器）
    Evidence: .omo/evidence/task-3-back-reader.png

  Scenario: 设置详情页返回键
    Tool: interactive_bash (ADB)
    Preconditions: 在设置页，打开某个详情（如 WebDAV）
    Steps:
      1. adb shell input keyevent KEYCODE_BACK
      2. 等待 1 秒
      3. ADB 截图
    Expected Result: 回到设置列表（截图显示设置列表而非详情）
    Evidence: .omo/evidence/task-3-back-settings.png
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `fix: add Android back button handling and immersive mode support`
  - Files: `android/app/src/main/java/.../MainActivity.java`, `src/App.tsx`

---

- [x] 4. **Android 沉浸式全屏阅读模式（原生端）**

  **What to do**:
  - `MainActivity.java`: 添加 `setImmersiveMode(boolean)` 方法，用于隐藏/显示状态栏和导航栏
  - 使用 `View.setSystemUiVisibility()` 或 `WindowInsetsControllerCompat` 实现沉浸模式
  - 通过 Capacitor 插件 `@capacitor/status-bar` 或自定义 Event 与 Web 层通信
  - 若使用 `@capacitor/status-bar`，在 `package.json` 添加依赖并运行 `npx cap sync android`

  **Must NOT do**:
  - 不要移除 `BridgeActivity` 继承
  - 不要影响其他 Activity 的正常生命周期

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Android 原生 UI 开发经验

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-3, 5-7)
  - **Blocks**: 12
  - **Blocked By**: None

  **References**:
  - `MainActivity.java`
  - Android `View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY` 文档
  - Capacitor `@capacitor/status-bar` 插件文档
  - `src/components/Reader.tsx` — 阅读器组件（将调用沉浸模式切换）

  **Acceptance Criteria**:
  - [ ] 沉浸模式相关代码在 MainActivity.java 中添加
  - [ ] `@capacitor/status-bar` 安装（如选择该方式）
  - [ ] `npx cap sync android` 通过

  **QA Scenarios**:
  ```
  Scenario: 沉浸模式切换
    Tool: interactive_bash (ADB)
    Preconditions: Android 模拟器，app 在阅读页
    Steps:
      1. 触发进入阅读模式
      2. 截图（应无状态栏和导航栏）
      3. 点击中央区域切换 UI
      4. 截图（顶部栏应短暂显示后隐藏）
    Expected Result: 沉浸模式工作，UI 按超时隐藏
    Evidence: .omo/evidence/task-4-immersive.png

  Scenario: 退出阅读恢复正常
    Tool: interactive_bash (ADB)
    Preconditions: 阅读页中
    Steps:
      1. 返回书架
      2. 截图（状态栏应正常显示）
    Expected Result: 退出阅读器后沉浸模式解除
    Evidence: .omo/evidence/task-4-immersive-exit.png
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `fix: add Android back button handling and immersive mode support`
  - Files: `android/app/src/main/java/.../MainActivity.java`, `package.json` (新增依赖)

---

- [x] 5. **键盘避让 CSS 机制**

  **What to do**:
  - 创建 `src/hooks/useKeyboard.ts` — 检测键盘弹出/隐藏的自定义 Hook
  - Hook 返回 `{ keyboardHeight: number, isKeyboardVisible: boolean }`
  - 使用 `window.visualViewport` API 监听视口高度变化（比 `resize` 事件更准确）
  - 在 `src/App.tsx` 中添加全局键盘状态管理
  - 为 AI Panel、Settings 等提供键盘高度上下文
  - 在 `index.html` 添加 CSS: `input, textarea { font-size: 16px }`（防止 iOS/Android 自动缩放）

  **Must NOT do**:
  - 不要使用 `resize` 事件（不如 visualViewport 准确）
  - 不要添加新的 npm 依赖

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - React Hook 设计 + 移动端键盘事件处理

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-4, 6-7)
  - **Blocks**: 17, 20
  - **Blocked By**: None

  **References**:
  - `src/App.tsx` — 根组件顶层状态
  - `MDN: VisualViewport API` — `window.visualViewport` 文档
  - `src/components/AIPanel.tsx` — AI 输入框将使用此 hook
  - `src/components/SettingsPage.tsx` — 设置输入将使用此 hook

  **Acceptance Criteria**:
  - [ ] `src/hooks/useKeyboard.ts` 创建
  - [ ] 在移动端模拟器上，键盘弹出时 hook 返回正确的 keyboardHeight
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 键盘弹出检测
    Tool: interactive_bash (ADB) + Chrome DevTools
    Preconditions: Android 模拟器，app 运行中
    Steps:
      1. 在 Chrome DevTools 中监视 keyboardHeight 值
      2. ADB 点击输入框弹出键盘
      3. 确认 keyboardHeight > 0 且 isKeyboardVisible = true
    Expected Result: Hook 正确检测键盘弹出
    Evidence: .omo/evidence/task-5-keyboard-detect.txt

  Scenario: 键盘隐藏检测
    Tool: interactive_bash (ADB)
    Preconditions: 键盘已弹出
    Steps:
      1. 点击返回键隐藏键盘
      2. 确认 keyboardHeight = 0 且 isKeyboardVisible = false
    Expected Result: Hook 正确检测键盘隐藏
    Evidence: .omo/evidence/task-5-keyboard-hide.txt
  ```

  **Commit**: YES (groups with Task 6, 7)
  - Message: `fix: add keyboard avoidance hook, touch target utilities, and page-turn zone constants`
  - Files: `src/hooks/useKeyboard.ts`, `index.html`

---

- [x] 6. **触摸目标 48dp 尺寸工具**

  **What to do**:
  - 在 `src/utils/styles.ts` 中添加移动端触摸目标常量：
    - `const MIN_TOUCH_TARGET = 44` (px, ~48dp 在 2.75x 设备上)
    - 辅助函数 `ensureTouchTarget(style: CSSProperties): CSSProperties` 确保最小宽高
  - 扫描所有按钮/可交互元素，标注当前尺寸 < 44px 的位置
  - 批量修复 `SelectionToolbar.tsx`: 颜色选择器从 28x28 → 44x44
  - 批量修复 `MarkersPanel.tsx` / `AIPanel.tsx` / `CustomThemePanel.tsx`: 关闭按钮 padding 增大
  - 批量修复 `BookShelf.tsx`: 删除按钮 24x24 → 44x44
  - 批量修复 `StatsPage.tsx` / `SettingsPage.tsx`: 交互元素至少 44px

  **Must NOT do**:
  - 不要改变按钮的视觉间距（只加大可点击区域，可通过 padding/扩大透明区域实现）
  - 不要改变布局的网格尺寸

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - UI 组件适应性修改 + 触屏设计原则

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-5, 7)
  - **Blocks**: 14, 18-20
  - **Blocked By**: None

  **References**:
  - `src/utils/styles.ts` — 常量定义位置
  - `src/components/SelectionToolbar.tsx:36` — 28x28 颜色按钮
  - `src/components/BookShelf.tsx:256` — 24x24 删除按钮
  - `src/components/MarkersPanel.tsx` — 多处小按钮
  - `src/components/AIPanel.tsx` — 关闭按钮
  - `src/components/CustomThemePanel.tsx` — 颜色 input 28x24
  - Android Material Design 触摸目标规范 (48dp)

  **Acceptance Criteria**:
  - [ ] `src/utils/styles.ts` 添加了触摸目标常量和辅助函数
  - [ ] `SelectionToolbar.tsx` 颜色选择器尺寸 ≥ 44px
  - [ ] `BookShelf.tsx` 删除按钮 ≥ 44px
  - [ ] 所有面板的关闭按钮 padding 增大到可点击范围 ≥ 44px
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 触摸目标尺寸验证
    Tool: Bash (grep style properties)
    Preconditions: 文件已修改
    Steps:
      1. grep "width: 28" src/components/SelectionToolbar.tsx → 应无匹配
      2. grep "width: 24" src/components/BookShelf.tsx → 应无匹配（删除按钮）
    Expected Result: 小尺寸按钮已被替换
    Evidence: .omo/evidence/task-6-touch-targets.txt

  Scenario: 构建通过
    Tool: Bash (npm run build)
    Preconditions: 依赖已安装
    Steps:
      1. npm run build
    Expected Result: 构建成功
    Evidence: .omo/evidence/task-6-build.txt
  ```

  **Commit**: YES (groups with Task 5, 7)
  - Message: `fix: add keyboard avoidance hook, touch target utilities, and page-turn zone constants`
  - Files: `src/utils/styles.ts`, `src/components/SelectionToolbar.tsx`, `src/components/BookShelf.tsx`, `src/components/MarkersPanel.tsx`, `src/components/AIPanel.tsx`, `src/components/CustomThemePanel.tsx`, `src/components/StatsPage.tsx`, `src/components/SettingsPage.tsx`

---

- [x] 7. **翻页区域常量和共享样式**

  **What to do**:
  - 在 `src/utils/styles.ts` 中添加翻页区域常量：
    - `PAGE_TURN_LEFT_ZONE = 0.30` (屏幕左 30% = 上一页)
    - `PAGE_TURN_RIGHT_ZONE = 0.30` (屏幕右 30% = 下一页)
    - `PAGE_TURN_CENTER_ZONE = 0.40` (中间 40% = 切换 UI)
  - 添加触摸翻页手势常量：`SWIPE_THRESHOLD = 50` (px，滑动超过 50px 触发翻页)
  - 建立 swipe gesture 辅助函数（用于 Task 10）

  **Must NOT do**:
  - 不要在此时修改 Reader.tsx（常量已就绪，Task 10/11 会使用）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 交互设计 + 常量提取

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with 1-6)
  - **Blocks**: 10, 11
  - **Blocked By**: None

  **References**:
  - `src/utils/styles.ts` — 常量位置
  - `src/components/Reader.tsx:201-208` — 当前翻页点击区域硬编码 0.22/0.78

  **Acceptance Criteria**:
  - [ ] `src/utils/styles.ts` 添加了翻页区域常量
  - [ ] 添加了 SWIPE_THRESHOLD 常量
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 常量被正确导出
    Tool: Bash (grep + node)
    Preconditions: 文件已修改
    Steps:
      1. grep "PAGE_TURN" src/utils/styles.ts → 确认常量存在
      2. grep "SWIPE_THRESHOLD" src/utils/styles.ts → 确认常量存在
    Expected Result: 所有常量已定义并可导入
    Evidence: .omo/evidence/task-7-constants.txt
  ```

  **Commit**: YES (groups with Task 5, 6)
  - Message: `fix: add keyboard avoidance hook, touch target utilities, and page-turn zone constants`
  - Files: `src/utils/styles.ts`

---

### Wave 2 — Reader 核心修复 (6 任务并行，依赖 Wave 1)

- [x] 8. **Reader 顶栏 Safe Area + 布局优化**

  **What to do**:
  - `src/components/Reader.tsx`: 修改顶栏容器（Line 227-279）的 CSS：
    - `padding-top: calc(env(safe-area-inset-top) + 36px)` 替代硬编码 `paddingTop: '36px'`
    - 注意同时避免了 #root 全局 safe-area + Reader 自身 padding 的**双重间距**问题
    - 确保顶栏在沉浸模式下正确工作（可能隐藏）
  - 优化顶栏布局：减少垂直空间浪费，考虑在沉浸模式下变得更薄
  - 移除 #root 全局 safe-area-inset-top，改为组件级控制

  **Must NOT do**:
  - 不要修改顶栏按钮的功能或顺序
  - 不要修改主题切换逻辑

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - CSS 布局 + 响应式设计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 9-13)
  - **Blocks**: 14-16
  - **Blocked By**: 1 (global safe-area CSS), 5 (keyboard avoidance), 6 (touch target), 7 (shared styles)

  **References**:
  - `src/components/Reader.tsx:227-279` — 顶栏当前实现
  - `index.html` — 全局 #root CSS（需要协调避免双重间距）
  - `src/hooks/useEpub.ts` — 主题管理

  **Acceptance Criteria**:
  - [ ] 顶栏 `padding-top` 使用 `env(safe-area-inset-top)`
  - [ ] 解决了 #root ≈ 顶栏的双重间距问题
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 顶栏 Safe Area 验证
    Tool: interactive_bash (ADB screenshot)
    Preconditions: Android 模拟器 with notch
    Steps:
      1. 打开图书进入阅读页
      2. 截图
      3. 检查顶栏未被 notch 遮挡
    Expected Result: 顶栏内容在安全区域内可见
    Evidence: .omo/evidence/task-8-topbar-safearea.png

  Scenario: 顶栏和 #root 无双重间距
    Tool: Playwright (在浏览模式查看页面)
    Preconditions: 开发服务器运行中
    Steps:
      1. 检查 #root 的 padding-top 和 Reader 顶栏的 padding-top
      2. 确认它们没有叠加（总间距应 ≈ 单一 padding）
    Expected Result: 无叠加间距（视觉上合理）
    Evidence: .omo/evidence/task-8-topbar-no-double.txt
  ```

  **Commit**: YES (groups with Task 9)
  - Message: `fix: reader top/bottom bar safe area and layout optimization`
  - Files: `src/components/Reader.tsx`, `index.html`

---

- [x] 9. **Reader 底栏 Safe Area + 布局优化**

  **What to do**:
  - `src/components/Reader.tsx`: 修改底栏容器（Line 282-328）的 CSS：
    - `padding-bottom: calc(env(safe-area-inset-bottom) + 8px)` 替代硬编码 `padding: '8px'`
    - 确保进度条和翻页按钮不重叠手势导航条
  - AI 按钮（Line 331-344）也添加 safe-area-bottom 偏移

  **Must NOT do**:
  - 不要改变底栏的功能或布局结构

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - CSS 布局 + 移动端适配

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8, 10-13)
  - **Blocks**: 14, 15, 17
  - **Blocked By**: 1 (global safe-area CSS), 5 (keyboard), 6 (touch target), 7 (shared styles)

  **References**:
  - `src/components/Reader.tsx:282-328` — 底栏当前实现
  - `src/components/Reader.tsx:331-344` — AI 按钮

  **Acceptance Criteria**:
  - [ ] 底栏 `padding-bottom` 使用 `env(safe-area-inset-bottom)`
  - [ ] AI 按钮不被手势导航条遮挡
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 底栏 Safe Area 验证
    Tool: interactive_bash (ADB screenshot)
    Preconditions: Android 模拟器 with gesture navigation
    Steps:
      1. 打开图书进入阅读页
      2. 截图
      3. 检查底栏不被手势导航条遮挡
    Expected Result: 底栏内容在安全区域内可见
    Evidence: .omo/evidence/task-9-bottombar-safearea.png
  ```

  **Commit**: YES (groups with Task 8)
  - Message: `fix: reader top/bottom bar safe area and layout optimization`
  - Files: `src/components/Reader.tsx`

---

- [x] 10. **Reader 滑动翻页手势支持**

  **What to do**:
  - `src/components/Reader.tsx`: 添加 touch 事件处理
  - 监听 `touchstart` / `touchmove` / `touchend` 事件
  - 记录 touch 起始 X 位置，计算滑动距离
  - 当 `|deltaX| > SWIPE_THRESHOLD` (50px) 时触发翻页：
    - `deltaX < -50` → 下一页（`nextRef.current()`）
    - `deltaX > 50` → 上一页（`prevRef.current()`）
  - 较短的滑动（< 50px）不触发，降级为 tap 点击（复用现有点击区域逻辑）
  - 确保不干扰 iframe 内部滚动（垂直滑动 pass-through）
  - 在 `LayoutPanel.tsx` 或设置中可关闭手势（"slider to turn" 开关）

  **Must NOT do**:
  - 不要移除现有点击翻页逻辑
  - 不要使用外部手势库（保持零依赖）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 触摸事件处理 + 手势交互设计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with 8, 9, 11-13)
  - **Blocks**: None
  - **Blocked By**: 7 (SWIPE_THRESHOLD constant)

  **References**:
  - `src/components/Reader.tsx:139-152` — 现有 wheel 事件处理（参考模式）
  - `src/utils/styles.ts` — SWIPE_THRESHOLD 常量
  - `src/hooks/useEpub.ts:goNext/goPrev` — 翻页函数

  **Acceptance Criteria**:
  - [ ] 水平滑动 ≥ 50px 触发翻页
  - [ ] 短滑动或不触发翻页（降级为 tap）
  - [ ] 不干扰垂直滚动
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 右滑上一页
    Tool: interactive_bash (ADB)
    Preconditions: Android 模拟器，阅读页中
    Steps:
      1. adb shell input touchscreen swipe 800 500 100 500 100
         (从右侧 800px 滑到 100px，模拟右滑)
      2. 等待翻页动画完成
      3. 截图
    Expected Result: 页面翻到上一章
    Evidence: .omo/evidence/task-10-swipe-prev.png

  Scenario: 左滑下一页
    Tool: interactive_bash (ADB)
    Preconditions: 同上
    Steps:
      1. adb shell input touchscreen swipe 100 500 800 500 100
         (左滑)
      2. 截图
    Expected Result: 页面翻到下一章
    Evidence: .omo/evidence/task-10-swipe-next.png

  Scenario: 短滑动不触发
    Tool: interactive_bash (ADB)
    Preconditions: 同上
    Steps:
      1. adb shell input touchscreen swipe 400 500 430 500 100
         (仅滑动 30px)
      2. 截图对比
    Expected Result: 页面未翻动（低于阈值）
    Evidence: .omo/evidence/task-10-swipe-short.png
  ```

  **Commit**: YES
  - Message: `fix: add swipe gesture support for page turning in reader`
  - Files: `src/components/Reader.tsx`, `src/components/LayoutPanel.tsx` (手势开关)

---

- [x] 11. **Reader 翻页点击区域重设计（30/40/30 比例）**

  **What to do**:
  - `src/components/Reader.tsx`: 修改 `handleViewerClick` 函数（Line 189-208）
  - 将当前硬编码比例 `0.22`（左）/ `0.78`（右）替换为 Wave 1 定义的常量：
    - `x < w * PAGE_TURN_LEFT_ZONE` (0.30) → 上一页
    - `x > w * (1 - PAGE_TURN_RIGHT_ZONE)` (0.70) → 下一页
    - 中间区域 (40%) → 切换 UI
  - 移除已不适用桌面的鼠标相关样式 (`onMouseEnter`/`onMouseLeave`)
  - 可选：添加视觉提示（半透明区域指示器），显示点击区域

  **Must NOT do**:
  - 不要移除滑动手势（两者共存）
  - 不要移除键盘翻页和蓝牙翻页支持

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 交互设计 + 触摸交互

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with 8-10, 12-13)
  - **Blocks**: None
  - **Blocked By**: 7 (PAGE_TURN constants)

  **References**:
  - `src/components/Reader.tsx:189-208` — 当前 `handleViewerClick`
  - `src/utils/styles.ts` — PAGE_TURN_LEFT_ZONE, PAGE_TURN_RIGHT_ZONE 常量

  **Acceptance Criteria**:
  - [ ] 左 30% 点击 → 上一页
  - [ ] 右 30% 点击 → 下一页
  - [ ] 中间 40% 点击 → 切换 UI 显示/隐藏
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 左 30% 区域翻页
    Tool: interactive_bash (ADB tap)
    Preconditions: Android 模拟器
    Steps:
      1. 计算屏幕左 30% 位置：屏幕宽度 1080px → tap 150 500
      2. 截图确认页面变化
    Expected Result: 上一页
    Evidence: .omo/evidence/task-11-tap-left.png

  Scenario: 中间 40% 区域切换 UI
    Tool: interactive_bash (ADB tap)
    Preconditions: UI 当前可见
    Steps:
      1. tap 540 500（屏幕中央）
      2. 截图
    Expected Result: UI 隐藏（顶部底栏消失）
    Evidence: .omo/evidence/task-11-tap-center.png

  Scenario: 右 30% 区域翻页
    Tool: interactive_bash (ADB tap)
    Steps:
      1. tap 950 500（屏幕右 30%）
      2. 截图确认页面变化
    Expected Result: 下一页
    Evidence: .omo/evidence/task-11-tap-right.png
  ```

  **Commit**: YES
  - Message: `fix: redesign page-turn tap zones to 30/40/30 for mobile`
  - Files: `src/components/Reader.tsx`

---

- [x] 12. **Reader 沉浸模式集成**

  **What to do**:
  - `src/components/Reader.tsx`: 添加沉浸模式切换逻辑
  - 进入阅读页时（`onLoad` 之后），调用 Task 4 的沉浸模式方法
  - 退出阅读页时（`onBack`），调用对应的退出沉浸模式方法
  - 通过 Capacitor 插件 / 自定义 Bridge 调用原生代码
  - 实现：使用 `@capacitor/status-bar` 的 `StatusBar.hide()` / `StatusBar.show()`
  - 底部导航栏隐藏：使用原生 `setSystemUiVisibility` 方法
  - 在 `LayoutPanel.tsx` 添加"沉浸模式"开关

  **Must NOT do**:
  - 不要影响正常 UI 切换（tap center 时短暂显示状态栏）
  - 不要修改非阅读页的状态栏行为

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Capacitor 插件 + 原生交互

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with 8-11, 13)
  - **Blocks**: None
  - **Blocked By**: 4 (MainActivity immersive mode implementation)

  **References**:
  - `src/components/Reader.tsx:72-101` — 当前加载逻辑
  - `src/components/Reader.tsx:103-109` — 当前 onResize (参考模式)
  - `@capacitor/status-bar` 插件 API

  **Acceptance Criteria**:
  - [ ] 进入阅读页后状态栏和导航栏隐藏
  - [ ] 退出阅读页后恢复正常
  - [ ] 点击中央 UI 切换时短暂显示状态栏（可选）
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 进入阅读沉浸模式
    Tool: interactive_bash (ADB)
    Preconditions: Android 模拟器
    Steps:
      1. 打开图书
      2. 等待 2 秒
      3. 截图
    Expected Result: 状态栏和导航栏不可见
    Evidence: .omo/evidence/task-12-immersive-enter.png

  Scenario: 退出阅读恢复正常
    Tool: interactive_bash (ADB)
    Steps:
      1. 按返回键回到书架
      2. 截图
    Expected Result: 状态栏和导航栏正常显示
    Evidence: .omo/evidence/task-12-immersive-exit.png
  ```

  **Commit**: YES (groups with Task 13)
  - Message: `fix: integrate immersive mode and add loading states for reader`
  - Files: `src/components/Reader.tsx`, `src/components/LayoutPanel.tsx`

---

- [x] 13. **Reader/书籍打开加载状态指示器**

  **What to do**:
  - `src/components/Reader.tsx`: 添加加载状态
    - 当 `meta` 为 null 时（表示 openBook 还在进行），显示居中 loading spinner
    - 使用 CSS animation（非图片）实现旋转/脉冲动画
    - 显示 "正在加载..." 中文文本
  - `src/hooks/useEpub.ts`: 在 `openBook` 开始时设置 loading 状态（export 一个 `isLoading`）
  - `src/components/BookShelf.tsx`: 导入书籍时（`import`）的 loading 状态已存在但可优化样式
  - 全文搜索 `useSearch.ts`: 搜索索引构建时显示"正在构建索引..."提示（而不是静默等待）

  **Must NOT do**:
  - 不要添加外部 spinner 库
  - 不要阻塞 UI 线程（使用 CSS 动画而非 JS 循环）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 加载状态 UX 设计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with 8-12)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/components/Reader.tsx` — Reader UI
  - `src/hooks/useEpub.ts:72-237` — `openBook` 异步流程
  - `src/hooks/useSearch.ts:45-60` — `buildSearchIndex`
  - `src/components/BookShelf.tsx` — 导入 loading（已有）

  **Acceptance Criteria**:
  - [ ] 打开书籍时显示 loading spinner + 文字
  - [ ] 搜索索引构建时显示提示
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 打开书籍显示 loading
    Tool: Playwright (模拟慢速网络)
    Preconditions: 开发服务器运行
    Steps:
      1. 点击书籍
      2. 观察界面（应出现 loading 指示器）
    Expected Result: 书籍打开过程中显示加载状态
    Evidence: .omo/evidence/task-13-loading-book.png

  Scenario: 加载完成后指示器消失
    Tool: Playwright
    Preconditions: 书已打开
    Steps:
      1. 检查 loading 元素是否存在
    Expected Result: 加载完成后指示器消失，阅读内容显示
    Evidence: .omo/evidence/task-13-loading-done.png
  ```

  **Commit**: YES (groups with Task 12)
  - Message: `fix: integrate immersive mode and add loading states for reader`
  - Files: `src/components/Reader.tsx`, `src/hooks/useEpub.ts`, `src/hooks/useSearch.ts`

---

### Wave 3 — 组件面板修复 (6 任务并行，依赖 Wave 1 + Wave 2)

- [x] 14. **LayoutPanel Safe Area + 触摸目标**

  **What to do**:
  - `src/components/LayoutPanel.tsx`:
    - 底部面板 `padding-bottom` 使用 `calc(env(safe-area-inset-bottom) + 16px)` 替代硬编码 32px
    - 所有 slider 的 `cursor: pointer` 保持不变（触摸设备不需要 hover）
    - 确保面板关闭按钮（✕）可点击区域 ≥ 44px
    - 所有 toggle switch 增大到适合触摸（当前 width: 40, height: 22 → width: 48, height: 28）
    - 字体选择 / 动画模式按钮增大 padding 以便触摸

  **Must NOT do**:
  - 不要改变面板的动画/过渡效果

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 移动端 UI 组件调优

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with 15-19)
  - **Blocks**: 20
  - **Blocked By**: 1 (global safe-area), 6 (touch target utilities), 8, 9 (Reader bar safe area)

  **References**:
  - `src/components/LayoutPanel.tsx` — 当前实现
  - `src/utils/styles.ts` — 触摸目标辅助函数

  **Acceptance Criteria**:
  - [ ] 底部面板 padding-bottom 使用 `env(safe-area-inset-bottom)`
  - [ ] toggle switch 增大到 48x28
  - [ ] 关闭按钮触摸区域 ≥ 44px
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: LayoutPanel Safe Area
    Tool: interactive_bash (ADB)
    Preconditions: Android 模拟器
    Steps:
      1. 打开 LayoutPanel
      2. 截图
      3. 检查底部内容不被手势导航条遮挡
    Expected Result: 面板内容在安全区域内
    Evidence: .omo/evidence/task-14-layoutpanel-safearea.png
  ```

  **Commit**: YES (groups with Task 15)
  - Message: `fix: layout/markers panels safe area and touch target improvements`
  - Files: `src/components/LayoutPanel.tsx`

---

- [x] 15. **MarkersPanel Safe Area**

  **What to do**:
  - `src/components/MarkersPanel.tsx`:
    - 底部面板 `padding-bottom` 使用 `calc(env(safe-area-inset-bottom) + 16px)` 替代硬编码 32px
    - 关闭按钮（✕）触摸区域 ≥ 44px
    - 书签/高亮列表项 padding 增大以适合触摸（当前 `padding: 10px 12px` → 适当增加）

  **Must NOT do**:
  - 不要改变面板的标签切换逻辑

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 移动端 UI 适配

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with 14, 16-19)
  - **Blocks**: 20
  - **Blocked By**: 1, 6, 8, 9

  **References**:
  - `src/components/MarkersPanel.tsx` — 当前实现

  **Acceptance Criteria**:
  - [ ] 底部 padding 使用 `env(safe-area-inset-bottom)`
  - [ ] 关闭按钮 ≥ 44px
  - [ ] 列表项 padding 增大
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: MarkersPanel Safe Area
    Tool: interactive_bash (ADB screenshot)
    Preconditions: 打开 MarkersPanel
    Steps:
      1. 截图检查底部
    Expected Result: 内容不被手势导航条遮挡
    Evidence: .omo/evidence/task-15-markerspanel-safearea.png
  ```

  **Commit**: YES (groups with Task 14)
  - Message: `fix: layout/markers panels safe area and touch target improvements`
  - Files: `src/components/MarkersPanel.tsx`

---

- [x] 16. **Sidebar Safe Area**

  **What to do**:
  - `src/components/Sidebar.tsx`:
    - 侧边栏目前 `position: fixed; top: 0; left: 0; bottom: 0`
    - 添加 `padding-top: env(safe-area-inset-top)` 和 `padding-bottom: env(safe-area-inset-bottom)`
    - 顶部的标题和关闭按钮区域添加 safe area 适配
    - 底部的目录列表确保可滚动到 safe-area 边界

  **Must NOT do**:
  - 不要改变侧边栏宽度（`min(320px, 80vw)` 保持）
  - 不要改变 TOC 展开/折叠逻辑

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 侧边栏布局

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with 14, 15, 17-19)
  - **Blocks**: 20
  - **Blocked By**: 1, 8, 9

  **References**:
  - `src/components/Sidebar.tsx:66-95` — 侧边栏当前布局

  **Acceptance Criteria**:
  - [ ] 侧边栏添加了 `env(safe-area-inset-*)` padding
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: Sidebar Safe Area
    Tool: interactive_bash (ADB screenshot)
    Preconditions: 打开目录侧边栏
    Steps:
      1. 截图检查顶部和底部
    Expected Result: 内容不被 notch 和导航条遮挡
    Evidence: .omo/evidence/task-16-sidebar-safearea.png
  ```

  **Commit**: YES
  - Message: `fix: sidebar safe area padding`
  - Files: `src/components/Sidebar.tsx`

---

- [x] 17. **AIPanel 键盘避让 + Safe Area**

  **What to do**:
  - `src/components/AIPanel.tsx`:
    - 当前 `position: absolute; bottom: 0; height: 45vh` → 使用键盘高度 hook 动态调整
    - 当键盘弹出时：将面板底部上移到键盘上方（`bottom: ${keyboardHeight}px`）
    - 添加 `padding-bottom: env(safe-area-inset-bottom)`（当键盘未弹出时）
    - 输入框区域在键盘弹出时保持可见（现在是固定底部）
    - 关闭按钮触摸区域 ≥ 44px

  **Must NOT do**:
  - 不要改变 AI 聊天逻辑
  - 不要修改流式渲染

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 键盘避让 + 动态布局

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with 14-16, 18-19)
  - **Blocks**: 20
  - **Blocked By**: 1 (safe-area), 5 (useKeyboard hook), 6 (touch target), 9 (bottom bar pattern)

  **References**:
  - `src/components/AIPanel.tsx:195-312` — AI 面板实现
  - `src/hooks/useKeyboard.ts` — 键盘检测 hook

  **Acceptance Criteria**:
  - [ ] 键盘弹出时面板底部上移 `keyboardHeight` px
  - [ ] 输入框在键盘弹出时可见且可用
  - [ ] 键盘隐藏时恢复 `env(safe-area-inset-bottom)` padding
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 键盘弹出时 AI 面板避让
    Tool: interactive_bash (ADB)
    Preconditions: AI 面板打开
    Steps:
      1. 点击输入框弹出键盘
      2. 等待 0.5 秒
      3. 截图
    Expected Result: AI 面板底部上移到键盘上方，输入框可见
    Evidence: .omo/evidence/task-17-aipanel-keyboard.png

  Scenario: 键盘隐藏后恢复
    Tool: interactive_bash (ADB)
    Steps:
      1. 按返回键隐藏键盘
      2. 截图
    Expected Result: AI 面板恢复到正常底部位置
    Evidence: .omo/evidence/task-17-aipanel-keyboard-hide.png
  ```

  **Commit**: YES
  - Message: `fix: add keyboard avoidance and safe area to AI panel`
  - Files: `src/components/AIPanel.tsx`

---

- [x] 18. **SelectionToolbar 触摸目标放大**

  **What to do**:
  - `src/components/SelectionToolbar.tsx`:
    - 颜色选择按钮从 `width: 28, height: 28` → `width: 44, height: 44`
    - 增加按钮间距：`gap: 6` → `gap: 10`
    - 增加整个工具栏的 padding：`padding: '8px 14px'` → `padding: '12px 18px'`
    - 关闭按钮（✕）增加 padding，触摸区域 ≥ 44px
    - 工具栏位置微调：`top: Math.max(8, bounds.top - 50)` → `top: Math.max(12, bounds.top - 60)`（因为按钮变大了）

  **Must NOT do**:
  - 不要改变工具栏的显示/隐藏逻辑
  - 不要改变颜色选择流程

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 触摸交互优化

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with 14-17, 19)
  - **Blocks**: 20
  - **Blocked By**: 6 (touch target utilities)

  **References**:
  - `src/components/SelectionToolbar.tsx` — 当前实现

  **Acceptance Criteria**:
  - [ ] 颜色按钮 ≥ 44x44
  - [ ] 工具栏 padding 增大
  - [ ] 关闭按钮 ≥ 44px
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 选择工具栏尺寸验证
    Tool: Bash (grep)
    Preconditions: 文件已修改
    Steps:
      1. grep "width: 28" src/components/SelectionToolbar.tsx → 应无匹配
      2. grep "width: 44" src/components/SelectionToolbar.tsx → 应匹配
    Expected Result: 工具按钮尺寸已更新到 44px
    Evidence: .omo/evidence/task-18-selection-toolbar-size.txt
  ```

  **Commit**: YES
  - Message: `fix: enlarge selection toolbar touch targets for mobile`
  - Files: `src/components/SelectionToolbar.tsx`

---

- [x] 19. **BookShelf 网格 + 触摸目标改进**

  **What to do**:
  - `src/components/BookShelf.tsx`:
    - 删除按钮 24x24 → 外层容器增大到 44x44（保持视觉效果，扩大点击区域）
    - 继续阅读区域水平滚动的触摸友好：增大卡片间距和触摸反馈
    - 网格布局在窄屏手机上：当前 `minmax(120px, 1fr)` → `minmax(100px, 1fr)` 允许更紧凑排列
    - 书籍封面点击区域：增加整个卡片区域的触摸反馈（已有 hover 效果，添加 active 状态）
    - 确保所有 `onClick` 元素至少有 44px 高度
    - 搜索输入框和排序按钮：增大 padding

  **Must NOT do**:
  - 不要改变 BookShelf 的布局结构（继续保持 flex/grid 布局）
  - 不要修改 import/delete 逻辑

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 响应式网格 + 触摸优化

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with 14-18)
  - **Blocks**: 20
  - **Blocked By**: 6 (touch target utilities)

  **References**:
  - `src/components/BookShelf.tsx` — 当前实现

  **Acceptance Criteria**:
  - [ ] 删除按钮触摸区域 ≥ 44x44
  - [ ] 搜索输入框 padding 增大
  - [ ] 书籍卡片触摸反馈改善
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 删除按钮触摸区域
    Tool: Bash (grep)
    Steps:
      1. grep "width: 24" src/components/BookShelf.tsx → 应无匹配
    Expected Result: 小尺寸按钮已被替换
    Evidence: .omo/evidence/task-19-bookshelf-delete.txt

  Scenario: 网格渲染正常
    Tool: Playwright
    Steps:
      1. 打开书架页
      2. 截图
    Expected Result: 书籍网格正常显示，所有元素完整
    Evidence: .omo/evidence/task-19-bookshelf-grid.png
  ```

  **Commit**: YES
  - Message: `fix: improve bookshelf touch targets and grid responsiveness`
  - Files: `src/components/BookShelf.tsx`

---

### Wave 4 — 打磨和一致性 (5 任务并行，依赖 Wave 3)

- [x] 20. **Settings/Stats 页面键盘避让 + 触摸目标**

  **What to do**:
  - `src/components/SettingsPage.tsx`:
    - WebDAV 和 AI 设置表单的输入框使用键盘 hook（`useKeyboard`），当键盘弹出时滚动到可见区域
    - 按钮（保存、测试连接）touch target ≥ 44px
  - `src/components/StatsPage.tsx`:
    - 确保交互元素符合触摸目标标准
  - `src/components/AISettings.tsx`:
    - API Key 等输入框键盘避让
    - 按钮 touch target 增大
  - `src/components/SyncSettings.tsx`:
    - WebDAV 配置输入框键盘避让
    - 按钮 touch target 增大

  **Must NOT do**:
  - 不要修改 WebDAV 同步逻辑
  - 不要修改 AI 配置保存逻辑

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 表单适配 + 键盘处理

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with 21-24)
  - **Blocks**: F1-F4
  - **Blocked By**: 5 (useKeyboard hook), 14-19 (Wave 3)

  **References**:
  - `src/components/SettingsPage.tsx` — 设置主页面
  - `src/components/StatsPage.tsx` — 统计页面
  - `src/components/AISettings.tsx` — AI 配置表单
  - `src/components/SyncSettings.tsx` — WebDAV 配置表单

  **Acceptance Criteria**:
  - [ ] 所有设置页输入框在键盘弹出时可见
  - [ ] 所有按钮 touch target ≥ 44px
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 设置页键盘避让
    Tool: interactive_bash (ADB)
    Preconditions: 打开 WebDAV 设置详情
    Steps:
      1. 点击 URL 输入框弹出键盘
      2. 截图
    Expected Result: 输入框在键盘上方可见
    Evidence: .omo/evidence/task-20-settings-keyboard.png

  Scenario: 设置页按钮尺寸
    Tool: Bash (grep)
    Steps:
      1. grep "padding.*10px.*20px" src/components/AISettings.tsx → 应匹配
    Expected Result: 按钮有足够的 padding
    Evidence: .omo/evidence/task-20-settings-buttons.txt
  ```

  **Commit**: YES (groups with Task 21)
  - Message: `fix: keyboard avoidance and touch targets for settings pages`
  - Files: `src/components/SettingsPage.tsx`, `src/components/StatsPage.tsx`, `src/components/AISettings.tsx`, `src/components/SyncSettings.tsx`

---

- [x] 21. **错误处理改进（用户可见）**

  **What to do**:
  - 扫描所有 `console.warn` / `.catch(console.warn)` 位置，判断是否应该展示给用户
  - `src/App.tsx`:
    - Line 46: 导入失败时给用户显示 toast/提示（当前仅 console.warn）
    - Line 62: 导入异常给用户反馈
  - `src/hooks/useEpub.ts`:
    - `openBook` 中多处 `catch(e) { console.warn(...) }` → 严重错误应设置错误状态
    - Line 162: 加载保存配置失败 → silent continue 是可接受的（降级使用默认值）
    - Line 211: CFI 恢复失败 → 降级到索引/默认页，可 silent 或通知用户
  - 创建一个简单的 toast/通知机制（轻量，非侵入式）：
    - 在 `App.tsx` 添加消息状态 `[message, setMessage]`
    - 定时自动消失（3 秒）
    - 所有面板统一使用

  **Must NOT do**:
  - 不要添加新的错误追踪服务
  - 不要重构错误处理架构（仅添加用户可见的反馈）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - 错误处理和用户体验

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with 20, 22-24)
  - **Blocks**: F1-F4
  - **Blocked By**: 14-19 (Wave 3)

  **References**:
  - `src/App.tsx:46,62` — 当前错误处理（catch + console.warn）
  - `src/hooks/useEpub.ts` — 多处错误处理

  **Acceptance Criteria**:
  - [ ] 关键错误显示给用户（非 console.warn 静默吞掉）
  - [ ] 非关键错误降级使用默认值（不影响用户体验）
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 导入失败显示错误
    Tool: Playwright (模拟文件导入失败)
    Preconditions: 开发服务器运行
    Steps:
      1. 尝试导入一个损坏的 EPUB 文件
      2. 观察界面
    Expected Result: 显示错误提示（非静默失败）
    Evidence: .omo/evidence/task-21-error-handling.png
  ```

  **Commit**: YES (groups with Task 20)
  - Message: `fix: add user-visible error handling for critical failures`
  - Files: `src/App.tsx`, `src/hooks/useEpub.ts`

---

- [x] 22. **主题色彩一致性**

  **What to do**:
  - 统一所有暗色背景值为一个常量（建议 `#0f0c29`）
  - 在 `src/utils/styles.ts` 中添加：
    - `const THEME_DARK_BG = '#0f0c29'`
    - `const THEME_DARK_GLASS = 'rgba(15,12,41,0.85)'` (或者相应透明度)
  - 更新以下位置使用统一的变量：
    - `src/components/Reader.tsx:themeBg.dark` — `#0a0a1a` → 使用变量
    - `src/components/AIPanel.tsx:themeBg.dark` — `#0f0c29` ✅ 已一致
    - `src/components/LayoutPanel.tsx:12` — `#0f0c29e0` → 使用变量
    - `src/components/Sidebar.tsx:22` — `#0f0c29e0` → 使用变量
    - `src/components/MarkersPanel.tsx:18` — `#0f0c29e0` → 使用变量
  - `Reader.tsx:themeBg.custom` — `#0a0a1a` → 使用变量

  **Must NOT do**:
  - 不要改变 light 或 sepia 主题颜色
  - 不要改变自定义主题的逻辑

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - 设计一致性

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with 20, 21, 23, 24)
  - **Blocks**: F1-F4
  - **Blocked By**: 14-19 (Wave 3)

  **References**:
  - `src/utils/styles.ts` — 常量定义位置
  - 所有组件中的背景色值

  **Acceptance Criteria**:
  - [ ] `src/utils/styles.ts` 添加了暗色主题常量
  - [ ] 所有组件使用统一常量
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 暗色主题一致性
    Tool: Bash (grep 检查硬编码值)
    Steps:
      1. grep "#0a0a1a" src/components/*.tsx → 应无匹配（被替换为变量）
    Expected Result: 无硬编码暗色值残留
    Evidence: .omo/evidence/task-22-theme-consistency.txt

  Scenario: 构建通过
    Tool: Bash (npm run build)
    Expected Result: 构建成功
    Evidence: .omo/evidence/task-22-build.txt
  ```

  **Commit**: YES
  - Message: `fix: unify dark theme color constants across components`
  - Files: `src/utils/styles.ts`, `src/components/Reader.tsx`, `src/components/LayoutPanel.tsx`, `src/components/Sidebar.tsx`, `src/components/MarkersPanel.tsx`

---

- [x] 23. **CSS 兼容性加固**

  **What to do**:
  - `backdrop-filter` 兼容性:
    - 对所有使用 `backdrop-filter: blur()` 的元素，添加降级方案:
    - CSS 中 `@supports (backdrop-filter: blur(1px))` 检测
    - 在不支持的浏览器中：使用纯色背景替代（不透明度调高）
    - 影响文件：Reader.tsx (glass), LayoutPanel.tsx, MarkersPanel.tsx, Sidebar.tsx, AIPanel.tsx, SidebarNav.tsx
  - CSS `env(safe-area-inset-*)` 兼容性:
    - 确保存在 `env()` 和 `constant()` (iOS 老版本) 两种写法
    - 提供 fallback 值（如 `padding-top: 36px` → `padding-top: constant(safe-area-inset-top, 36px)`）
  - `-webkit-line-clamp` 兼容性: 已在 MarkersPanel 使用，保留（广泛支持）
  - `writing-mode: vertical-lr` 在 StatsPage 保留（主要浏览器都支持）

  **Must NOT do**:
  - 不要移除支持良好的 CSS 特性
  - 不要为极低版本浏览器做降级

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - CSS 兼容性 + 渐进增强

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with 20-22, 24)
  - **Blocks**: F1-F4
  - **Blocked By**: 14-19 (Wave 3)

  **References**:
  - Android WebView 版本兼容性文档 (Chrome 69+ for env())
  - 所有使用 `backdrop-filter` 的组件

  **Acceptance Criteria**:
  - [ ] `backdrop-filter` 有降级方案（不支持时显示纯色背景）
  - [ ] `env()` 有 fallback 值
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: CSS 兼容性检查
    Tool: Bash (grep)
    Steps:
      1. grep -r "backdrop-filter" src/ --include="*.tsx" → 确认所有位置
      2. 确保每个位置有降级 background
    Expected Result: 所有 backdrop-filter 有纯色背景降级
    Evidence: .omo/evidence/task-23-css-compat.txt
  ```

  **Commit**: YES (groups with Task 24)
  - Message: `fix: harden CSS compatibility with fallbacks for older WebViews`
  - Files: 所有使用 `backdrop-filter` 的组件

---

- [x] 24. **最终构建验证 + Lint 修复**

  **What to do**:
  - 运行 `npx tsc --noEmit` → 修复所有新类型错误
  - 运行 `npm run lint` → 修复所有新 lint 错误
  - 运行 `npm run build` → 确保生产构建通过
  - 确保所有组件引用正确、没有 dead import
  - 清理 Task 1-23 产生的临时/调试代码

  **Must NOT do**:
  - 不要在这一步修改功能逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - 构建修复 + Lint 修复

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with 20-23)
  - **Blocks**: F1-F4
  - **Blocked By**: 14-19 (Wave 3)

  **References**:
  - `package.json` — build/lint scripts
  - `tsconfig.json` — TypeScript 配置
  - `eslint.config.js` — Lint 配置

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` 通过
  - [ ] `npm run lint` 通过
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 生产构建通过
    Tool: Bash
    Steps:
      1. npx tsc --noEmit
      2. npm run lint
      3. npm run build
    Expected Result: 所有命令返回 exit code 0
    Evidence: .omo/evidence/task-24-build-final.txt
  ```

  **Commit**: YES
  - Message: `chore: fix type errors, lint issues, and verify production build`
  - Files: 修复后的类型/lint 错误文件

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, inspect CSS, check component code). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .omo/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `npm run lint`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA on Android** — `unspecified-high`
  Build and run on Android emulator (or attached device). Test: Safe Area rendering, back button behavior, keyboard avoidance on all input fields, swipe-to-turn gesture, tap zone regions (30/40/30), immersive mode enter/exit, NoteDialog display, loading states visible during book open. Capture screenshots/recording.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in scope was built (no missing), nothing beyond scope was built (no creep). Check "Must NOT do" compliance.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

Plan commits grouped by wave:
- **Wave 1**: `fix: global safe-area CSS, Capacitor config, back button, immersive mode, keyboard avoidance, touch targets`
- **Wave 2**: `fix: reader UI safe area, swipe gesture, click zones, immersive mode, loading states`
- **Wave 3**: `fix: layout/markers/sidebar/AI panels safe area, selection/book shelf touch targets`
- **Wave 4**: `fix: settings polish, error handling, theme consistency, CSS compatibility`

---

## Success Criteria

### Verification Commands
```bash
npm run build        # Should pass without errors
npx tsc --noEmit     # Should pass without type errors
npm run lint         # Should pass without lint errors
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] `npm run build` passes
- [ ] Safe Area renders correctly on notch emulator
- [ ] Back button navigates correctly in all contexts
- [ ] All input fields accessible when keyboard is open
- [ ] Swipe gesture works for page turning
- [ ] Touch targets ≥ 44px
