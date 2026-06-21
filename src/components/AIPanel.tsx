import { useState, useRef, useEffect, useCallback } from 'react'
import type { AIConfig, AIChatMessage } from '../types'
import { useKeyboard } from '../hooks/useKeyboard'

const _pulseId = '_ai_pulse'
if (typeof document !== 'undefined' && !document.getElementById(_pulseId)) {
  const s = document.createElement('style')
  s.id = _pulseId
  s.textContent = '@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}'
  document.head.appendChild(s)
}

interface AIPanelProps {
  visible: boolean
  onClose: () => void
  config: AIConfig | null
  theme: 'light' | 'dark' | 'sepia'
  onGetChapterText: () => Promise<string>
  onGetFullBookText: () => Promise<string>
}

const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"
const fontBody = "system-ui, -apple-system, 'Segoe UI', sans-serif"

const themeBg: Record<string, string> = {
  light: '#f4ead5',
  sepia: '#f0e8d0',
  dark: '#0a0807',
}

/** 玻璃背景色跟随阅读主题 — v2: 极小圆角、更深底色 */
const panelBase: Record<string, [number, number, number]> = {
  dark:   [10, 8, 7],
  sepia:  [240, 232, 208],
  light:  [244, 234, 213],
  custom: [10, 8, 7],
}
const glass = (theme: string) => {
  const [r, g, b] = panelBase[theme] ?? panelBase.dark
  const isLight = theme === 'light' || theme === 'sepia'
  return {
    background: `rgba(${r}, ${g}, ${b}, ${isLight ? 0.92 : 0.96})`,
    backdropFilter: 'blur(20px) saturate(140%)',
    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderTop: `1px solid ${isLight ? 'rgba(212,146,58,0.20)' : 'rgba(240,235,226,0.10)'}`,
  }
}

// Browser-based AI streaming (replaces Electron IPC)
async function streamAI(
  config: AIConfig,
  messages: AIChatMessage[],
  onToken: (token: string) => void,
): Promise<string> {
  const url = `${config.apiUrl.replace(/\/+$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error')
    throw new Error(`AI API error (${res.status}): ${text}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') break
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content || ''
        if (content) {
          full += content
          onToken(content)
        }
      } catch {
        console.warn('[AIPanel] failed to parse SSE line:', data)
      }
    }
  }

  return full
}

async function chatAI(config: AIConfig, messages: AIChatMessage[]): Promise<string> {
  const url = `${config.apiUrl.replace(/\/+$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error')
    throw new Error(`AI API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

export function AIPanel({ visible, onClose, config, theme, onGetChapterText, onGetFullBookText }: AIPanelProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: 'system', content: '你是一个智能阅读助手，帮助用户理解书籍内容。回答简洁、准确。' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const msgEndRef = useRef<HTMLDivElement>(null)
  const { keyboardHeight, isKeyboardVisible } = useKeyboard()

  const dark = theme === 'dark'
  const fg = dark ? '#f0ebe2' : '#3d2b1a'
  const muted = dark ? 'rgba(240,235,226,0.45)' : 'rgba(61,43,26,0.45)'

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, isKeyboardVisible])

  const addMessage = useCallback((msg: AIChatMessage) => {
    setMessages(prev => [...prev, msg])
  }, [])

  const handleSummary = useCallback(async () => {
    if (!config || loading) return
    setLoading(true)
    setStreamingText('')

    const chapterText = await onGetChapterText()
    if (!chapterText) {
      addMessage({ role: 'assistant', content: '无法获取当前章节内容。' })
      setLoading(false)
      return
    }

    const summaryMsg: AIChatMessage = { role: 'user', content: `请用中文总结以下章节内容，列出关键要点：\n\n${chapterText}` }
    addMessage(summaryMsg)

    try {
      const full = await streamAI(config, [...messages, summaryMsg], (token) => {
        setStreamingText(prev => prev + token)
      })
      addMessage({ role: 'assistant', content: full })
      setStreamingText('')
    } catch (err: any) {
      addMessage({ role: 'assistant', content: `错误: ${err.message}` })
      setStreamingText('')
    }
    setLoading(false)
  }, [config, loading, onGetChapterText, messages, addMessage])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !config || loading) return
    const userMsg: AIChatMessage = { role: 'user', content: input }
    setInput('')
    addMessage(userMsg)
    setLoading(true)
    setStreamingText('')

    const chapterText = await onGetChapterText()
    const contextMsg: AIChatMessage = chapterText
      ? { role: 'user', content: `以下是我正在阅读的章节内容（供参考，无需直接回复此内容）：\n${chapterText}` }
      : { role: 'user', content: '（无当前章节内容）' }

    try {
      const full = await streamAI(config, [...messages, contextMsg, userMsg], (token) => {
        setStreamingText(prev => prev + token)
      })
      addMessage({ role: 'assistant', content: full })
      setStreamingText('')
    } catch (err: any) {
      addMessage({ role: 'assistant', content: `错误: ${err.message}` })
      setStreamingText('')
    }
    setLoading(false)
  }, [input, config, loading, onGetChapterText, messages, addMessage])

  const displayMessages = messages.filter(m => m.role !== 'system')

  return (
    <>
      {visible && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: isKeyboardVisible ? `calc(45vh + ${keyboardHeight * 0.4}px)` : '45vh',
          zIndex: 10,
          display: 'flex', flexDirection: 'column',
          ...glass(theme),
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            position: 'relative',
          }}>
            {/* corner-cut 印章 */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 20, height: 20,
              background: dark ? 'rgba(168,67,30,0.85)' : 'rgba(168,67,30,0.18)',
              clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
              pointerEvents: 'none',
            }} />
            <span style={{
              fontFamily: fontDisplay, fontSize: 18,
              fontWeight: 700, color: fg, letterSpacing: '-0.01em',
            }}>AI 助手</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!config && (
                <span style={{ color: 'rgba(248,113,113,0.8)', fontSize: 11 }}>未配置 API</span>
              )}
              <button onClick={handleSummary} disabled={loading || !config}
                style={{
                  border: 'none', borderRadius: 2, padding: '6px 14px',
                  fontFamily: fontDisplay, fontSize: 12, fontWeight: 600, cursor: loading || !config ? 'default' : 'pointer',
                  background: 'rgba(212,146,58,0.20)',
                  color: dark ? '#d4923a' : '#8a6030',
                  border: '1px solid rgba(212,146,58,0.30)',
                  opacity: loading || !config ? 0.4 : 1,
                }}
              >总结本章</button>
              <button onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 18, padding: '0 4px' }}
              >✕</button>
            </div>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {displayMessages.length === 0 && !loading && (
              <div style={{ color: muted, fontSize: 13, textAlign: 'center', marginTop: 24 }}>
                点击「总结本章」总结当前章节，或在下方输入问题提问。
              </div>
            )}
            {displayMessages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 2,
                fontFamily: fontBody,
                fontSize: 13,
                lineHeight: 1.6,
                color: fg,
                background: msg.role === 'user'
                  ? 'rgba(212,146,58,0.15)'
                  : (dark ? 'rgba(240,235,226,0.05)' : 'rgba(61,43,26,0.04)'),
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            ))}
            {streamingText && (
              <div style={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 2,
                fontFamily: fontBody,
                fontSize: 13,
                lineHeight: 1.6,
                color: fg,
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                whiteSpace: 'pre-wrap',
              }}>
                {streamingText}
                <span style={{ animation: 'pulse 1s infinite', opacity: 0.5 }}>▍</span>
              </div>
            )}
            {loading && !streamingText && (
              <div style={{
                alignSelf: 'flex-start', padding: '10px 14px',
                fontFamily: fontDisplay, color: muted, fontSize: 13,
              }}>
                <span style={{ opacity: 0.5 }}>思考中...</span>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          <div style={{
            display: 'flex', gap: 8, padding: '10px 16px 14px',
            borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="问任何关于本书的问题..."
              disabled={loading || !config}
              style={{
                flex: 1,
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(240,235,226,0.12)',
                borderRadius: 2, padding: '10px 14px',
                fontFamily: fontBody,
                color: fg, fontSize: 13, outline: 'none',
              }}
            />
            <button onClick={handleSend} disabled={!input.trim() || loading || !config}
              style={{
                border: 'none', borderRadius: 2, padding: '10px 18px',
                fontFamily: fontDisplay, fontSize: 13, fontWeight: 700,
                cursor: loading || !config || !input.trim() ? 'default' : 'pointer',
                background: '#d4923a',
                color: '#0a0807',
                opacity: loading || !config || !input.trim() ? 0.5 : 1,
                boxShadow: '0 4px 16px rgba(212,146,58,0.35)',
                transition: 'all 0.15s',
              }}
            >发送</button>
          </div>
        </div>
      )}
    </>
  )
}
