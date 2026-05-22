import { useState, useRef } from 'react'
import { saveWebDAVConfig, loadAllBooks, loadAllProgress, loadReadingTime } from '../utils/db'
import { testConnection, syncAll } from '../utils/webdav'
import type { WebDAVConfig, SyncProgressEvent } from '../types'
import type { CSSProperties } from 'react'

const inputStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

interface SyncSettingsProps {
  config: WebDAVConfig | null
  onConfigChange: (config: WebDAVConfig | null) => void
}

export function SyncSettings({ config, onConfigChange }: SyncSettingsProps) {
  const [form, setForm] = useState<WebDAVConfig>(config || { url: '', username: '', password: '', path: '/CoolReader' })
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgressEvent | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const handleTest = async () => {
    setTestResult('测试中...')
    const res = await testConnection(form)
    setTestResult(res.success ? '连接成功 ✓' : `连接失败: ${res.error}`)
  }

  const handleSave = () => {
    saveWebDAVConfig(form)
    onConfigChange(form)
    setTestResult('已保存')
  }

  const handleClear = () => {
    setForm({ url: '', username: '', password: '', path: '/CoolReader' })
    saveWebDAVConfig({} as any).catch(() => {})
    onConfigChange(null)
  }

  const handleSync = async () => {
    setSyncing(true)
    setProgress({ phase: 'connect', message: '准备同步...' })
    try {
      const localBooks = await loadAllBooks()
      const localProgress = await loadAllProgress()
      const today = new Date().toISOString().slice(0, 10)
      const readingSeconds = await loadReadingTime(today)

      const result = await syncAll(form, localBooks, localProgress, { [today]: readingSeconds }, (p) => {
        setProgress({ ...p })
      })

      if (result.errors.length > 0) {
        console.warn('[SyncSettings] sync errors:', result.errors)
      }
    } catch (e: any) {
      setProgress({ phase: 'done', message: `同步失败: ${e.message}` })
    }
    setSyncing(false)
  }

  const pct = progress?.total && progress?.current != null ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <input style={inputStyle} placeholder="WebDAV 地址" value={form.url}
          onChange={e => setForm({ ...form, url: e.target.value })} />
        <input style={inputStyle} placeholder="用户名" value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })} />
        <input style={inputStyle} type="password" placeholder="密码" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} />
        <input style={inputStyle} placeholder="路径 (默认 /CoolReader)" value={form.path}
          onChange={e => setForm({ ...form, path: e.target.value })} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={handleTest} style={btnStyle}>测试连接</button>
        <button onClick={handleSave} style={btnStyle}>保存配置</button>
        {config && <button onClick={handleClear} style={{ ...btnStyle, background: 'rgba(220,38,38,0.3)' }}>清除配置</button>}
        {config && (
          <button onClick={handleSync} disabled={syncing} style={{ ...btnStyle, background: 'linear-gradient(135deg, #667eea, #764ba2)', opacity: syncing ? 0.5 : 1 }}>
            {syncing ? '同步中...' : '全量同步'}
          </button>
        )}
      </div>

      {testResult && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 12 }}>{testResult}</div>}

      {progress && (
        <div ref={progressRef} style={{
          borderRadius: 10, padding: 12,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <div style={{ color: '#fff', fontSize: 12, marginBottom: 6 }}>{progress.message}</div>
          {progress.total && progress.total > 0 && (
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const btnStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
}
