import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { colors } from '../utils/styles'

const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"
const fontBody = "system-ui, -apple-system, 'Segoe UI', sans-serif"

interface NoteDialogOptions {
  title?: string
  placeholder?: string
  initialValue?: string
}

let resolvePromise: ((value: string | null) => void) | null = null
let currentResolve: ((value: string | null) => void) | null = null

export function showNoteDialog(options: NoteDialogOptions = {}): Promise<string | null> {
  const { title = '添加笔记', placeholder = '输入笔记（可选）', initialValue = '' } = options
  resolvePromise = (value: string | null) => {
    currentResolve?.(value)
    currentResolve = null
  }
  openNoteDialog(title, placeholder, initialValue)
  return new Promise<string | null>(resolve => { currentResolve = resolve })
}

function openNoteDialog(title: string, placeholder: string, initialValue: string) {
  window.dispatchEvent(new CustomEvent('note-dialog-open', { detail: { title, placeholder, initialValue } }))
}

export function NoteDialog() {
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { title, placeholder, initialValue } = e.detail
      if (dialogRef.current) {
        dialogRef.current.style.display = 'flex'
        inputRef.current!.value = initialValue
        inputRef.current!.placeholder = placeholder
        const titleEl = dialogRef.current.querySelector('[data-title]')
        if (titleEl) titleEl.textContent = title
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }
    window.addEventListener('note-dialog-open', handler as EventListener)
    return () => window.removeEventListener('note-dialog-open', handler as EventListener)
  }, [])

  const handleConfirm = () => {
    const text = inputRef.current?.value.trim() ?? ''
    dialogRef.current!.style.display = 'none'
    resolvePromise?.(text || null)
  }

  const handleCancel = () => {
    dialogRef.current!.style.display = 'none'
    resolvePromise?.(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') handleCancel()
  }

  return createPortal(
    <div ref={dialogRef} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'none', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,8,7,0.7)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    }} onClick={handleCancel}>
      <div onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown} style={{
        width: '85%', maxWidth: 400,
        padding: '28px 24px 22px',
        borderRadius: 2,
        background: 'var(--cr-glass-bg, rgba(28, 23, 16, 0.92))',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        border: `1px solid ${colors.borderAmber}`,
        boxShadow: '0 16px 60px rgba(0,0,0,0.6)',
        position: 'relative',
      }}>
        {/* corner-cut 印章 */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 20, height: 20,
          background: colors.seal,
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          opacity: 0.85, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 3, right: 3,
          fontFamily: fontDisplay, fontSize: 6, color: '#0a0807',
          fontWeight: 700, letterSpacing: '0.05em', pointerEvents: 'none',
        }}>NOTE</div>

        <span data-title style={{
          fontFamily: fontDisplay, fontSize: 18, fontWeight: 700,
          color: colors.text, letterSpacing: '-0.01em',
        }}>添加笔记</span>
        <input ref={inputRef} style={{
          width: '100%', boxSizing: 'border-box',
          padding: '12px 14px', marginTop: 16,
          borderRadius: 2,
          background: 'rgba(240,235,226,0.05)',
          border: `1px solid ${colors.border}`,
          fontFamily: fontBody,
          color: colors.text, fontSize: 15, outline: 'none',
        }} placeholder="输入笔记（可选）" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={handleCancel} style={{
            padding: '9px 22px', borderRadius: 2, border: 'none',
            background: 'rgba(240,235,226,0.08)', color: colors.textMuted,
            fontFamily: fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}>取消</button>
          <button onClick={handleConfirm} style={{
            padding: '9px 22px', borderRadius: 2, border: 'none',
            background: colors.amber, color: '#0a0807',
            fontFamily: fontDisplay, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 4px 14px ${colors.amberGlow}`,
            transition: 'transform 0.15s',
          }}>确认</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
