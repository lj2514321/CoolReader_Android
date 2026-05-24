import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

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
  return new Promise<string | null>(resolve => {
    currentResolve = resolve
  })
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

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 100,
    display: 'none', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
  }

  const dialogStyle: React.CSSProperties = {
    width: '85%', maxWidth: 400,
    padding: '24px 20px 20px',
    borderRadius: 16,
    background: 'rgba(15,12,41,0.92)',
    backdropFilter: 'blur(24px) saturate(140%)',
    WebkitBackdropFilter: 'blur(24px) saturate(140%)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', marginTop: 12,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontSize: 15, outline: 'none',
  }

  const btnRow: React.CSSProperties = {
    display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18,
  }

  const btnBase: React.CSSProperties = {
    padding: '9px 22px', borderRadius: 10, border: 'none',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  }

  return createPortal(
    <div ref={dialogRef} style={overlayStyle} onClick={handleCancel}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <span data-title style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>添加笔记</span>
        <input
          ref={inputRef}
          style={inputStyle}
          placeholder="输入笔记（可选）"
        />
        <div style={btnRow}>
          <button onClick={handleCancel} style={{ ...btnBase, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            取消
          </button>
          <button onClick={handleConfirm} style={{ ...btnBase, background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff' }}>
            确认
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}