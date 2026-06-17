import { useState, useRef, useEffect } from 'react'
import { bgPresets } from '../utils/styles'
import { saveSetting, loadSetting, loadAllBooks, loadHighlights, loadProgress, loadReadingTime } from '../utils/db'
import { exportToMarkdown, exportToTxt } from '../utils/export'
import { exportBackup, importBackup } from '../utils/backup'
import { syncAll } from '../utils/webdav'
import { SyncSettings } from './SyncSettings'
import { AISettings } from './AISettings'
import { WallpaperEditor } from './WallpaperEditor'
import type { WebDAVConfig, AIConfig, CustomBgConfig } from '../types'
import { defaultCustomBg } from '../types'
import { colors } from '../utils/styles'

/* ── Direction A+C design tokens (书卷气) ─────────── */
const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"
const fontBody = "system-ui, -apple-system, 'Segoe UI', sans-serif"

const cardStyle: React.CSSProperties = {
  background: colors.bgRaised,
  border: `1px solid ${colors.border}`,
  borderRadius: 2, // 极小圆角 — 书页直角感
  boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  padding: '18px 20px',
}

const btnSecondary = (active = false): React.CSSProperties => ({
  background: active ? colors.amberDim : 'rgba(240,235,226,0.04)',
  border: `1px solid ${active ? colors.borderAmber : colors.border}`,
  color: active ? colors.amber : colors.text,
  fontWeight: 500,
  borderRadius: 2,
  padding: '8px 18px',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: fontBody,
  transition: 'all 0.15s',
})

const btnPrimary: React.CSSProperties = {
  padding: '10px 28px', borderRadius: 2, cursor: 'pointer',
  background: colors.amber, border: 'none',
  color: '#0a0807', fontSize: 14, fontWeight: 700,
  fontFamily: fontBody,
  letterSpacing: '0.02em',
  boxShadow: `0 4px 16px ${colors.amberGlow}`,
  transition: 'all 0.15s',
}

const btnSuccess: React.CSSProperties = {
  ...btnSecondary(false),
  background: 'rgba(122,170,110,0.10)',
  borderColor: 'rgba(122,170,110,0.30)',
  color: colors.green,
}

const SectionLabel = ({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) => (
  <div style={{
    color: accent ? colors.seal : colors.textMuted,
    fontFamily: fontDisplay,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 14,
    letterSpacing: '0.12em',
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <span style={{
      display: 'inline-block', width: 14, height: 1,
      background: accent ? colors.seal : 'rgba(240,235,226,0.20)',
    }} />
    {children}
  </div>
)

interface SettingsPageProps {
  bgKey: string
  onPresetChange: (key: string, gradient: string) => void
  resetKey?: number
  visible?: boolean
  customBg?: CustomBgConfig | null
  onCustomBgChange?: (config: CustomBgConfig) => void
  webdavConfig?: WebDAVConfig | null
  onWebDAVConfigChange?: (config: WebDAVConfig | null) => void
  aiConfig?: AIConfig | null
  onAIConfigChange?: (config: AIConfig | null) => void
  readingGoal?: number
  onReadingGoalChange?: (goal: number) => void
  startupBehavior?: 'library' | 'resume'
  onStartupBehaviorChange?: (v: 'library' | 'resume') => void
}

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

export function SettingsPage({ bgKey, onPresetChange, resetKey = 0, visible = true, customBg, onCustomBgChange, webdavConfig, onWebDAVConfigChange, aiConfig, onAIConfigChange, readingGoal = 0, onReadingGoalChange, startupBehavior = 'library', onStartupBehaviorChange }: SettingsPageProps) {
  const [settingView, setSettingView] = useState<string | null>(null)
  const [subPhase, setSubPhase] = useState<'idle' | 'push-out' | 'push-in' | 'pop-out' | 'pop-in'>('idle')
  const [goalInput, setGoalInput] = useState(readingGoal)
  const [exportStatus, setExportStatus] = useState<string>('')
  const [lastSyncTime, setLastSyncTime] = useState<string>('')
  const subRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(subRef.current), [])
  useEffect(() => { setSettingView(null); setSubPhase('idle') }, [resetKey])
  useEffect(() => { loadSetting('lastWebDAVSync').then(t => t && setLastSyncTime(t)) }, [])

  const pushDetail = (id: string) => {
    if (subPhase !== 'idle') return
    if (id === 'readingGoal') setGoalInput(readingGoal)
    setSubPhase('push-out')
    clearTimeout(subRef.current)
    subRef.current = setTimeout(() => {
      setSettingView(id)
      requestAnimationFrame(() => setSubPhase('push-in'))
      subRef.current = setTimeout(() => setSubPhase('idle'), 400)
    }, 400)
  }

  const popDetail = () => {
    if (subPhase !== 'idle') return
    setSubPhase('pop-out')
    clearTimeout(subRef.current)
    subRef.current = setTimeout(() => {
      setSettingView(null)
      requestAnimationFrame(() => setSubPhase('pop-in'))
      subRef.current = setTimeout(() => setSubPhase('idle'), 400)
    }, 400)
  }

  const SETTINGS_ITEMS = [
    { id: 'bgPreset', label: '首页背景', summary: bgPresets.find(b => b.key === bgKey)?.label || '未设置' },
    { id: 'startup', label: '启动行为', summary: startupBehavior === 'resume' ? '继续阅读' : '显示书架' },
    { id: 'readingGoal', label: '阅读目标', summary: readingGoal > 0 ? `${readingGoal} 分钟/天` : '未设置' },
    { id: 'webdav', label: 'WebDAV 同步', summary: webdavConfig ? `已配置 (${webdavConfig.url})` : '' },
    { id: 'ai', label: 'AI 助手', summary: aiConfig ? `已配置 (${aiConfig.model})` : '' },
  ]

  return (
    <>
      {/* list view */}
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto', padding: '32px 24px 40px 24px',
        display: (subPhase !== 'idle' || settingView === null) ? '' : 'none',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: subPhase === 'pop-in' || (subPhase === 'idle' && settingView === null) ? 1 : 0,
        transform: subPhase === 'pop-in' || (subPhase === 'idle' && settingView === null) ? 'translateY(0)' : 'translateY(24px)',
        pointerEvents: visible && subPhase === 'idle' && settingView === null ? 'auto' : 'none',
      }}>
        {/* 大标题 — 衬线 + 暖光字距 */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
          <div style={{
            color: colors.amber,
            fontFamily: fontDisplay,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.30em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            SETTINGS
          </div>
          <h1 style={{
            color: colors.text,
            fontFamily: fontDisplay,
            fontSize: 32,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            墨 · 书房
          </h1>
        </div>

        {SETTINGS_ITEMS.map((item, idx) => (
          <div key={item.id} onClick={() => pushDetail(item.id)}
            style={{
              ...cardStyle,
              marginBottom: 0,
              borderRadius: 0,
              borderTop: idx === 0 ? `1px solid ${colors.border}` : 'none',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'transparent',
              padding: '18px 4px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,160,74,0.04)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div>
              <div style={{
                color: colors.text,
                fontFamily: fontDisplay,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}>{item.label}</div>
              {item.summary && <div style={{
                color: colors.textMuted,
                fontFamily: fontBody,
                fontSize: 12,
                marginTop: 4,
              }}>{item.summary}</div>}
            </div>
            <ChevronRight />
          </div>
        ))}

        {/* 导出笔记 */}
        <div style={{ ...cardStyle, marginTop: 32, borderTop: `1px solid ${colors.border}` }}>
          <SectionLabel accent>导出笔记</SectionLabel>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={async () => {
              try {
                const books = await loadAllBooks()
                const highlights = await loadHighlights(books[0]?.filePath || '')
                if (highlights.length === 0) { setExportStatus('没有可导出的笔记'); return }
                downloadFile(exportToMarkdown(highlights, '我的笔记'), 'notes.md', 'text/markdown')
                setExportStatus(`已导出 ${highlights.length} 条笔记`)
              } catch { setExportStatus('导出失败') }
            }} style={btnSecondary(true)}>Markdown</button>

            <button onClick={async () => {
              try {
                const books = await loadAllBooks()
                const highlights = await loadHighlights(books[0]?.filePath || '')
                if (highlights.length === 0) { setExportStatus('没有可导出的笔记'); return }
                downloadFile(exportToTxt(highlights, '我的笔记'), 'notes.txt', 'text/plain')
                setExportStatus(`已导出 ${highlights.length} 条笔记`)
              } catch { setExportStatus('导出失败') }
            }} style={btnSecondary(false)}>TXT</button>
          </div>
          {exportStatus && <div style={{ marginTop: 12, fontSize: 11, color: colors.textMuted, fontFamily: fontBody }}>{exportStatus}</div>}
        </div>

        {/* 备份恢复 */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionLabel>备份恢复</SectionLabel>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={async () => {
              try {
                const data = await exportBackup()
                const json = JSON.stringify(data, null, 2)
                const blob = new Blob([json], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `coolreader-backup-${new Date().toISOString().split('T')[0]}.json`
                a.click()
                URL.revokeObjectURL(url)
                setExportStatus('备份成功')
              } catch { setExportStatus('备份失败') }
            }} style={btnSuccess}>导出备份</button>

            <label style={btnSecondary(false)}>
              导入备份
              <input type="file" accept=".json" style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const data = JSON.parse(text)
                    const result = await importBackup(data)
                    setExportStatus(result.success ? '导入成功' : `导入完成，有 ${result.errors.length} 个错误`)
                  } catch { setExportStatus('导入失败：文件格式错误') }
                  e.target.value = ''
                }} />
            </label>
          </div>
        </div>

        {/* WebDAV 同步 */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionLabel>云端同步</SectionLabel>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={async () => {
              if (!webdavConfig) { setExportStatus('请先配置 WebDAV'); return }
              try {
                setExportStatus('同步中...')
                const books = await loadAllBooks()
                const progress = await loadProgress()
                const readingTime = await loadReadingTime()
                const result = await syncAll(webdavConfig, books, progress, readingTime,
                  evt => setExportStatus(evt.message))
                if (result.success) {
                  const now = new Date().toLocaleString('zh-CN')
                  setExportStatus(`同步完成 (上传 ${result.uploaded}, 下载 ${result.downloaded})`)
                  await saveSetting('lastWebDAVSync', now)
                  setLastSyncTime(now)
                } else {
                  setExportStatus('同步失败: ' + (result.errors[0] || '未知错误'))
                }
              } catch (e: any) {
                setExportStatus('同步失败: ' + e.message)
              }
            }} style={btnSecondary(true)}>立即同步</button>
            {exportStatus && <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: fontBody }}>{exportStatus}</span>}
          </div>
          {lastSyncTime && <div style={{ marginTop: 8, fontSize: 11, color: colors.textFaint, fontFamily: fontBody }}>上次同步: {lastSyncTime}</div>}
        </div>
      </div>

      {/* detail view */}
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto', padding: '32px 24px 40px 24px',
        display: (subPhase !== 'idle' || settingView !== null) ? '' : 'none',
        transition: 'all 0.4s ease',
        opacity: subPhase !== 'pop-in' && (subPhase !== 'idle' || settingView !== null) ? 1 : 0,
        transform: (subPhase === 'idle' && settingView !== null) || subPhase === 'push-in' ? 'translateX(0)' : 'translateX(100%)',
        pointerEvents: subPhase === 'idle' && settingView !== null ? 'auto' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer', paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }} onClick={popDetail}>
          <ChevronLeft />
          <p style={{
            color: colors.text,
            fontFamily: fontDisplay,
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.01em',
            pointerEvents: 'none',
          }}>
            {settingView === 'bgPreset' ? '首页背景'
              : settingView === 'startup' ? '启动行为'
              : settingView === 'readingGoal' ? '阅读目标'
              : settingView === 'webdav' ? 'WebDAV 同步'
              : settingView === 'ai' ? 'AI 助手' : ''}
          </p>
        </div>

        {settingView === 'bgPreset' && (
          <WallpaperEditor
            config={customBg ?? { ...defaultCustomBg, presetKey: bgKey }}
            onChange={(cfg) => {
              onCustomBgChange?.(cfg)
              if (cfg.type === 'preset' && cfg.presetKey) {
                const preset = bgPresets.find(p => p.key === cfg.presetKey)
                if (preset) onPresetChange(preset.key, preset.gradient)
              }
            }}
          />
        )}

        {settingView === 'startup' && (
          <div style={cardStyle}>
            <div style={{ color: colors.text, fontFamily: fontDisplay, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>启动后显示</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {([
                { value: 'library' as const, label: '书架', desc: '启动时显示书架页面' },
                { value: 'resume' as const, label: '继续阅读', desc: '自动打开上次阅读的图书' },
              ] as const).map(opt => {
                const isActive = startupBehavior === opt.value
                return (
                <label key={opt.value} style={{
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  padding: '14px 16px', borderRadius: 2,
                  background: isActive ? colors.amberDim : 'rgba(240,235,226,0.04)',
                  border: `1px solid ${isActive ? colors.borderAmber : colors.border}`,
                  boxShadow: isActive ? `0 0 12px ${colors.amberGlow}` : 'none',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="startup" value={opt.value}
                    checked={isActive}
                    onChange={() => { onStartupBehaviorChange?.(opt.value); saveSetting('startupBehavior', opt.value) }}
                    style={{ accentColor: colors.amber, width: 18, height: 18, cursor: 'pointer' }} />
                  <div>
                    <div style={{ color: isActive ? colors.amber : colors.text, fontFamily: fontDisplay, fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2, fontFamily: fontBody }}>{opt.desc}</div>
                  </div>
                </label>
              )})}
            </div>
            <button onClick={popDetail} style={btnPrimary}>确定</button>
          </div>
        )}

        {settingView === 'readingGoal' && (
          <div style={cardStyle}>
            <div style={{ color: colors.text, fontFamily: fontDisplay, fontSize: 16, fontWeight: 600, marginBottom: 12 }}>每日阅读目标</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <input type="number" min={0} max={600} value={goalInput}
                onChange={e => setGoalInput(Number(e.target.value))}
                style={{
                  flex: 1, padding: '12px 14px', borderRadius: 2,
                  border: `1px solid ${colors.border}`,
                  background: 'rgba(240,235,226,0.04)',
                  color: colors.text, fontSize: 18, fontWeight: 600, outline: 'none',
                  fontFamily: fontDisplay,
                }} />
              <span style={{ color: colors.textMuted, fontSize: 13, fontFamily: fontBody }}>分钟/天</span>
            </div>
            <div style={{ color: colors.textFaint, fontSize: 12, marginBottom: 16, fontFamily: fontBody }}>设为 0 可关闭阅读目标</div>
            <button onClick={() => {
              saveSetting('readingGoal', String(goalInput))
              onReadingGoalChange?.(goalInput)
              popDetail()
            }} style={btnPrimary}>保存</button>
          </div>
        )}

        {settingView === 'webdav' && (
          <SyncSettings config={webdavConfig ?? null} onConfigChange={onWebDAVConfigChange ?? (() => {})} />
        )}

        {settingView === 'ai' && (
          <AISettings config={aiConfig ?? null} onConfigChange={onAIConfigChange ?? (() => {})} />
        )}
      </div>
    </>
  )

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
