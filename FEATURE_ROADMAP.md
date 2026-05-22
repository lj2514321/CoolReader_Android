# CoolReader Android 功能对比清单

> 生成日期: 2026-05-22
> 参考项目: epub-reader-demo (Electron)

## 已完成移植 ✅

- 书架（书籍网格、搜索、按书名/作者/最近阅读排序）
- 图书导入（文件选择器）
- 图书删除（确认对话框）
- EPUB 渲染（epub.js）
- 深色/护眼/浅色 3 种主题
- 自定义主题（纯色 + 渐变编辑器，8 个内置预设 + 用户预设保存/删除）
- 目录侧边栏
- 书签（添加/删除/跳转）
- 高亮（颜色选择、添加、持久化、删除、标注笔记）
- 文字选择 + 标注工具栏
- 字号、字重（300-700）、行高、边距、字体族控制
- 翻页动画模式（fade / slide / blur-focus / slide-fade + reducedMotion 减弱动画）
- 翻页模式（paginated / scrolled）
- WebDAV 同步配置
- AI 助手面板
- 阅读时间统计（今日/本周/本月/总计 + 14天柱状图）
- 阅读目标设置
- 全文搜索（全书索引 + 结果预览 + 跳转定位）
- 图书馆背景渐变预设
- 蓝牙媒体键翻页（可开关）

---

## 低优先级（暂未移植）

#### 7. ~~蓝牙媒体键支持~~ ✅ 已完成
- **实现**: `layout.enableMediaKey` + `keydown` 监听 `MediaNextTrack`/`MediaPreviousTrack`

#### 8. 拖拽导入（移动端不适用）
- **说明**: 桌面支持拖放 EPUB 文件，移动端无意义，跳过

---

## 已完成功能参考

| 功能 | 核心文件 |
|------|---------|
| 全文搜索 | `src/hooks/useSearch.ts` |
| 自定义主题 | `src/components/CustomThemePanel.tsx` + `src/utils/customTheme.ts` |
| 字体粗细 | `src/types/index.ts`（ReaderLayout）+ `src/components/LayoutPanel.tsx` |
| 动画模式 | `src/utils/animation.ts` + `src/components/LayoutPanel.tsx` |
| Markers + 高亮 | `src/components/MarkersPanel.tsx` |
| 阅读进度排序 | `src/components/BookShelf.tsx` |