import { useState } from 'react'
import { Bookmark, Highlight } from '../types'

interface MarkersPanelProps {
  visible: boolean
  dark: boolean
  bookmarks: Bookmark[]
  highlights: Highlight[]
  markerTab: 'bookmarks' | 'highlights'
  onTabChange: (tab: 'bookmarks' | 'highlights') => void
  onNavigate: (cfi: string) => void
  onDeleteBookmark: (id: number) => void
  onDeleteHighlight: (id: number, cfiRange: string) => void
  onClose: () => void
}

export function MarkersPanel({ visible, dark, bookmarks, highlights, markerTab, onTabChange, onNavigate, onDeleteBookmark, onDeleteHighlight, onClose }: MarkersPanelProps) {
  const bg = dark ? '#0f0c29e0' : '#f0ecf8e0'
  const fg = dark ? '#c8c8e0' : '#2d2b55'
  const muted = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'
  const accent = 'rgba(99,102,241,0.2)'

  return (
    <>
      {visible && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 12, background: 'rgba(0,0,0,0.3)' }} />}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 13,
        background: bg,
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: '16px 20px 32px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.25s ease',
        maxHeight: '60vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: fg, fontSize: 16, fontWeight: 700 }}>📑 标记</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 20, padding: '4px 8px' }}>✕</button>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => onTabChange('bookmarks')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: markerTab === 'bookmarks' ? accent : 'transparent',
              border: `1px solid ${markerTab === 'bookmarks' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: markerTab === 'bookmarks' ? '#6366f1' : fg,
            }}
          >🔖 书签 ({bookmarks.length})</button>
          <button onClick={() => onTabChange('highlights')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: markerTab === 'highlights' ? accent : 'transparent',
              border: `1px solid ${markerTab === 'highlights' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: markerTab === 'highlights' ? '#6366f1' : fg,
            }}
          >🖍 标注 ({highlights.length})</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {markerTab === 'bookmarks' && bookmarks.length === 0 && (
            <div style={{ color: muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              暂无书签，阅读时点击顶部 📑 按钮添加
            </div>
          )}
          {markerTab === 'bookmarks' && bookmarks.map(bm => (
            <div key={bm.id} onClick={() => { onNavigate(bm.cfi); onClose() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.1)',
                marginBottom: 6,
                transition: 'background 0.12s',
              }}
            >
              <span style={{ fontSize: 16 }}>🔖</span>
              <span style={{ flex: 1, color: fg, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bm.label || '书签 ' + new Date(bm.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <button onClick={e => { e.stopPropagation(); if (bm.id) onDeleteBookmark(bm.id) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(220,38,38,0.6)', fontSize: 14, padding: '4px',
                }}
              >🗑</button>
            </div>
          ))}

          {markerTab === 'highlights' && highlights.length === 0 && (
            <div style={{ color: muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              选中文本后点击颜色添加标注
            </div>
          )}
          {markerTab === 'highlights' && highlights.map(hl => (
            <div key={hl.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.1)',
                marginBottom: 6,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 3, background: hl.color, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: fg, fontSize: 12, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  "{hl.text}"
                </div>
                {hl.note && (
                  <div style={{ color: muted, fontSize: 11, marginTop: 3, fontStyle: 'italic' }}>{hl.note}</div>
                )}
              </div>
              <button onClick={() => { if (hl.id) onDeleteHighlight(hl.id, hl.cfiRange) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(220,38,38,0.6)', fontSize: 14, padding: '4px',
                }}
              >🗑</button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}