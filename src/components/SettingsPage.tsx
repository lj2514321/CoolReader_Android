import { useState, useRef, useEffect } from 'react'
import { bgPresets } from '../utils/styles'
import { saveSetting, loadSetting, loadAllBooks, loadHighlights } from '../utils/db'
import { exportToMarkdown, exportToTxt } from '../utils/export'
import { exportBackup, importBackup } from '../utils/backup'
import { syncAll } from '../utils/webdav'
import { SyncSettings } from './SyncSettings'
import { AISettings } from './AISettings'
import type { WebDAVConfig, AIConfig } from '../types'
import type { CSSProperties } from 'react'

const settingItem: CSSProperties = {
  borderRadius: 14,
  background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
  border: '1px solid rgba(168,85,247,0.12)',
  padding: '16px 20px',
  marginBottom: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'background 0.15s',
}

interface SettingsPageProps {
  bgKey: string
  onPresetChange: (key: string, gradient: string) => void
  resetKey?: number
  visible?: boolean
  webdavConfig?: WebDAVConfig | null
  onWebDAVConfigChange?: (config: WebDAVConfig | null) => void
  aiConfig?: AIConfig | null
  onAIConfigChange?: (config: AIConfig | null) => void
  readingGoal?: number
  onReadingGoalChange?: (goal: number) => void
  startupBehavior?: 'library' | 'resume'
  onStartupBehaviorChange?: (v: 'library' | 'resume') => void
}

export function SettingsPage({ bgKey, onPresetChange, resetKey = 0, visible = true, webdavConfig, onWebDAVConfigChange, aiConfig, onAIConfigChange, readingGoal = 0, onReadingGoalChange, startupBehavior = 'library', onStartupBehaviorChange }: SettingsPageProps) {
  const [settingView, setSettingView] = useState<string | null>(null)
  const [subPhase, setSubPhase] = useState<'idle' | 'push-out' | 'push-in' | 'pop-out' | 'pop-in'>('idle')
  const [goalInput, setGoalInput] = useState(readingGoal)
  const [exportStatus, setExportStatus] = useState<string>('')
  const [lastSyncTime, setLastSyncTime] = useState<string>('')
  const subRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(subRef.current), [])
  useEffect(() => { setSettingView(null); setSubPhase('idle') }, [resetKey])
  useEffect(() => { loadSetting('lastWebDAVSync').then(t => t && setLastSyncTime(t)) }, [])

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

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

  return (
    <>
      {/* list view */}
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto', padding: '28px 20px 32px 20px',
        display: (subPhase !== 'idle' || settingView === null) ? '' : 'none',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: subPhase === 'pop-in' || (subPhase === 'idle' && settingView === null) ? 1 : 0,
        transform: subPhase === 'pop-in' || (subPhase === 'idle' && settingView === null) ? 'translateY(0)' : 'translateY(24px)',
        pointerEvents: visible && subPhase === 'idle' && settingView === null ? 'auto' : 'none',
      }}>
        <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 24px', letterSpacing: -0.3 }}>设置</p>
        {[
          { id: 'bgPreset', label: '首页背景', summary: bgPresets.find((b) => b.key === bgKey)?.label || '' },
          { id: 'startup', label: '启动行为', summary: startupBehavior === 'resume' ? '继续阅读' : '显示书架' },
          { id: 'readingGoal', label: '阅读目标', summary: readingGoal > 0 ? `${readingGoal} 分钟/天` : '未设置' },
          { id: 'webdav', label: 'WebDAV 同步', summary: webdavConfig ? `已配置 (${webdavConfig.url})` : '' },
          { id: 'ai', label: 'AI 助手', summary: aiConfig ? `已配置 (${aiConfig.model})` : '' },
        ].map((item) => (
          <div key={item.id} onClick={() => pushDetail(item.id)}
            style={settingItem}
          >
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{item.label}</div>
              {item.summary && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{item.summary}</div>}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>›</span>
          </div>
        ))}

        {/* 导出笔记 */}
        <div style={{
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
          border: '1px solid rgba(168,85,247,0.12)',
          padding: '16px',
          marginTop: 16,
        }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>导出笔记</div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                try {
                  const books = await loadAllBooks()
                  const highlights = await loadHighlights(books[0]?.filePath || '')
                  if (highlights.length === 0) {
                    setExportStatus('没有可导出的笔记')
                    return
                  }
                  const content = exportToMarkdown(highlights, '我的笔记')
                  downloadFile(content, 'notes.md', 'text/markdown')
                  setExportStatus(`已导出 ${highlights.length} 条笔记`)
                } catch (e) {
                  setExportStatus('导出失败')
                }
              }}
              style={{ background: 'rgba(99,102,241,0.3)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12 }}
            >
              Markdown
            </button>

            <button
              onClick={async () => {
                try {
                  const books = await loadAllBooks()
                  const highlights = await loadHighlights(books[0]?.filePath || '')
                  if (highlights.length === 0) {
                    setExportStatus('没有可导出的笔记')
                    return
                  }
                  const content = exportToTxt(highlights, '我的笔记')
                  downloadFile(content, 'notes.txt', 'text/plain')
                  setExportStatus(`已导出 ${highlights.length} 条笔记`)
                } catch (e) {
                  setExportStatus('导出失败')
                }
              }}
              style={{ background: 'rgba(168,85,247,0.3)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12 }}
            >
              TXT
            </button>
          </div>

          {exportStatus && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{exportStatus}</div>
          )}
        </div>

        {/* 备份恢复 */}
        <div style={{
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
          border: '1px solid rgba(168,85,247,0.12)',
          padding: '16px',
          marginTop: 16,
        }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>备份恢复</div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
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
                } catch (e) {
                  setExportStatus('备份失败')
                }
              }}
              style={{ background: 'rgba(48,161,78,0.3)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12 }}
            >
              导出备份
            </button>

            <label style={{ background: 'rgba(99,102,241,0.3)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12 }}>
              导入备份
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const data = JSON.parse(text)
                    const result = await importBackup(data)
                    if (result.success) {
                      setExportStatus(`导入成功`)
                    } else {
                      setExportStatus(`导入完成，有 ${result.errors.length} 个错误`)
                    }
                  } catch (e) {
                    setExportStatus('导入失败：文件格式错误')
                  }
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </div>

        {/* WebDAV 同步 */}
        <div style={{
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
          border: '1px solid rgba(168,85,247,0.12)',
          padding: '16px',
          marginTop: 16,
        }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>WebDAV 同步</div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                if (!webdavConfig) {
                  setExportStatus('请先配置 WebDAV')
                  return
                }
                try {
                  setExportStatus('同步中...')
                  const books = await loadAllBooks()
                  const { loadProgress } = await import('../utils/db')
                  const progress = await loadProgress()
                  const { loadReadingTime } = await import('../utils/db')
                  const readingTime = await loadReadingTime()
                  const result = await syncAll(
                    webdavConfig,
                    books,
                    progress,
                    readingTime,
                    (evt) => setExportStatus(evt.message)
                  )
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
              }}
              style={{ background: 'rgba(99,102,241,0.3)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12 }}
            >
              立即同步
            </button>
            {exportStatus && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{exportStatus}</span>
            )}
          </div>
          {lastSyncTime && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>上次同步: {lastSyncTime}</div>
          )}
        </div>
      </div>

      {/* detail view */}
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto', padding: '28px 20px 32px 20px',
        display: (subPhase !== 'idle' || settingView !== null) ? '' : 'none',
        transition: 'all 0.4s ease',
        opacity: subPhase !== 'pop-in' && (subPhase !== 'idle' || settingView !== null) ? 1 : 0,
        transform: (subPhase === 'idle' && settingView !== null) || subPhase === 'push-in' ? 'translateX(0)' : 'translateX(100%)',
        pointerEvents: subPhase === 'idle' && settingView !== null ? 'auto' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }} onClick={popDetail}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, padding: '4px 8px 4px 0' }}>‹</span>
          <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: -0.3, pointerEvents: 'none' }}>
            {settingView === 'bgPreset' ? '首页背景' : settingView === 'startup' ? '启动行为' : settingView === 'readingGoal' ? '阅读目标' : settingView === 'webdav' ? 'WebDAV 同步' : settingView === 'ai' ? 'AI 助手' : ''}
          </p>
        </div>

        {settingView === 'bgPreset' && (
          <div style={{
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
            border: '1px solid rgba(168,85,247,0.12)',
            padding: '24px 20px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {bgPresets.map((p) => (
                <button key={p.key} onClick={() => { saveSetting('bgPreset', p.key); onPresetChange(p.key, p.gradient) }}
                  style={{
                    cursor: 'pointer', border: bgKey === p.key ? '2px solid rgba(168,85,247,0.7)' : '2px solid transparent',
                    borderRadius: 12, overflow: 'hidden', padding: 0,
                    transition: 'border-color 0.15s',
                    background: 'none',
                  }}
                >
                  <div style={{
                    height: 54, background: p.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {bgKey === p.key && <span style={{ fontSize: 20, filter: 'invert(1) brightness(2)' }}>✓</span>}
                  </div>
                  <div style={{
                    padding: '6px 0', fontSize: 11, color: 'rgba(255,255,255,0.45)',
                    background: 'rgba(255,255,255,0.03)', textAlign: 'center',
                  }}>{p.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {settingView === 'startup' && (
          <div style={{
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
            border: '1px solid rgba(168,85,247,0.12)',
            padding: '24px 28px',
          }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>启动后显示</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { value: 'library' as const, label: '书架', desc: '启动时显示书架页面' },
                { value: 'resume' as const, label: '继续阅读', desc: '自动打开上次阅读的图书' },
              ].map(opt => (
                <label key={opt.value} style={{
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  padding: '12px 16px', borderRadius: 10,
                  background: startupBehavior === opt.value ? 'rgba(99,102,241,0.2)' : 'transparent',
                  border: `1px solid ${startupBehavior === opt.value ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="startup" value={opt.value}
                    checked={startupBehavior === opt.value}
                    onChange={() => { onStartupBehaviorChange?.(opt.value); saveSetting('startupBehavior', opt.value) }}
                    style={{ accentColor: '#6366f1', width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <button onClick={popDetail}
              style={{
                padding: '10px 28px', borderRadius: 8, cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(168,85,247,0.4) 100%)',
                border: '1px solid rgba(168,85,247,0.3)', color: '#fff', fontSize: 14, fontWeight: 600,
              }}
            >确定</button>
          </div>
        )}

        {settingView === 'readingGoal' && (
          <div style={{
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
            border: '1px solid rgba(168,85,247,0.12)',
            padding: '24px 28px',
          }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>每日阅读目标</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <input type="number" min={0} max={600} value={goalInput}
                onChange={e => setGoalInput(Number(e.target.value))}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 16, fontWeight: 600, outline: 'none',
                }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>分钟/天</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginBottom: 16 }}>设为 0 可关闭阅读目标</div>
            <button onClick={() => {
              saveSetting('readingGoal', String(goalInput))
              onReadingGoalChange?.(goalInput)
              popDetail()
            }}
              style={{
                padding: '10px 28px', borderRadius: 8, cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(168,85,247,0.4) 100%)',
                border: '1px solid rgba(168,85,247,0.3)', color: '#fff', fontSize: 14, fontWeight: 600,
              }}
            >保存</button>
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
}
