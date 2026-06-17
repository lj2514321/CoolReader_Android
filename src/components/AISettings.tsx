import { useState } from 'react'
import { saveAIConfig } from '../utils/db'
import type { AIConfig } from '../types'
import { colors } from '../utils/styles'

const inputStyle = {
  background: 'rgba(240,235,226,0.05)',
  border: `1px solid ${colors.border}`,
  borderRadius: 10, padding: '10px 14px',
  color: colors.text, fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box' as const,
}

interface AISettingsProps {
  config: AIConfig | null
  onConfigChange: (config: AIConfig | null) => void
}

export function AISettings({ config, onConfigChange }: AISettingsProps) {
  const [form, setForm] = useState<AIConfig>(config || { apiUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini' })
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleTest = async () => {
    setTestResult('测试中...')
    try {
      const url = `${form.apiUrl.replace(/\/+$/, '')}/chat/completions`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${form.apiKey}`,
        },
        body: JSON.stringify({
          model: form.model,
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false,
        }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setTestResult(`连接失败 (${res.status}): ${text}`)
        return
      }
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || ''
      setTestResult(`连接成功 ✓ 回复: ${reply.slice(0, 50)}`)
    } catch (e: any) {
      setTestResult(`连接失败: ${e.message}`)
    }
  }

  const handleSave = () => {
    saveAIConfig(form)
    onConfigChange(form)
    setTestResult('已保存')
  }

  const handleClear = () => {
    saveAIConfig({} as any).catch(() => {})
    onConfigChange(null)
    setForm({ apiUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini' })
  }

  const btnStyle = {
    background: 'rgba(240,235,226,0.08)', border: `1px solid ${colors.border}`,
    borderRadius: 10, padding: '10px 20px', color: colors.text, fontSize: 13,
    fontWeight: 600 as const, cursor: 'pointer', transition: 'all 0.15s',
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <input style={inputStyle} placeholder="API 地址" value={form.apiUrl}
          onChange={e => setForm({ ...form, apiUrl: e.target.value })} />
        <input style={inputStyle} type="password" placeholder="API Key" value={form.apiKey}
          onChange={e => setForm({ ...form, apiKey: e.target.value })} />
        <input style={inputStyle} placeholder="模型 (如 gpt-4o-mini, claude-sonnet)" value={form.model}
          onChange={e => setForm({ ...form, model: e.target.value })} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={handleTest} style={btnStyle}>测试连接</button>
        <button onClick={handleSave} style={btnStyle}>保存配置</button>
        {config && <button onClick={handleClear} style={{
          ...btnStyle,
          background: 'rgba(192,84,74,0.20)',
          borderColor: 'rgba(192,84,74,0.40)',
          color: colors.red,
        }}>清除配置</button>}
      </div>

      {testResult && <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>{testResult}</div>}
    </div>
  )
}
