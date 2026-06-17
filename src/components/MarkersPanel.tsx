import { useState } from 'react'
import { Bookmark, Highlight } from '../types'
import { colors } from '../utils/styles'

interface MarkersPanelProps {
  visible: boolean
  theme: string
  bookmarks: Bookmark[]
  highlights: Highlight[]
  markerTab: 'bookmarks' | 'highlights'
  onTabChange: (tab: 'bookmarks' | 'highlights') => void
  onNavigate: (cfi: string) => void
  onDeleteBookmark: (id: number) => void
  onDeleteHighlight: (id: number, cfiRange: string) => void
  onClose: () => void
}

const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"

const BookmarkIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={active ? colors.amber : 'none'} stroke={colors.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
)

const HighlightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

export function MarkersPanel({ visible, theme, bookmarks, highlights, markerTab, onTabChange, onNavigate, onDeleteBookmark, onDeleteHighlight, onClose }: MarkersPanelProps) {
  const dark = theme === 'dark' || theme === 'custom'
  const bg = dark ? 'rgba(10,8,7,0.96)' : 'rgba(244,234,213,0.92)'
  const fg = dark ? colors.text : '#3d2b1a'
  const muted = dark ? colors.textMuted : 'rgba(61,43,26,0.5)'
  const border = dark ? colors.border : 'rgba(212,146,58,0.20)'
  const itemBg = dark ? 'rgba(240,235,226,0.05)' : 'rgba(212,146,58,0.07)'

  const tab = (isActive: boolean, label: string, icon: JSX.Element, count: number) => (
    <button onClick={() => onTabChange(label as 'bookmarks' | 'highlights')}
      style={{
        flex: 1, padding: '10px 0', cursor: 'pointer',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${isActive ? colors.amber : 'transparent'}`,
        color: isActive ? colors.amber : muted,
        fontFamily: fontDisplay,
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        letterSpacing: '0.05em',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'all 0.2s',
        boxShadow: isActive ? `0 2px 12px ${colors.amberGlow}` : 'none',
      }}
    >{icon}<span>{label}</span><span style={{ color: isActive ? colors.amber : colors.textFaint, fontSize: 11, marginLeft: 2 }}>({count})</span></button>
  )

  return (
    <>
      {visible && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 12, background: 'rgba(10,8,7,0.35)' }} />}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 13,
        background: bg,
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderTopLeftRadius: 2, borderTopRightRadius: 2,
        padding: '20px 20px 36px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        maxHeight: '60vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        borderTop: `1px solid ${border}`,
      }}>
        {/* corner-cut 印章 */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 24, height: 24,
          background: colors.seal,
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          opacity: 0.85,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 4, right: 4,
          fontFamily: fontDisplay, fontSize: 7, color: '#0a0807',
          fontWeight: 700, letterSpacing: '0.05em', pointerEvents: 'none',
        }}>MARK</div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{
              fontFamily: fontDisplay,
              fontSize: 10, color: colors.amber,
              letterSpacing: '0.30em', fontWeight: 600,
              textTransform: 'uppercase', marginBottom: 2,
            }}>MARKERS</div>
            <span style={{
              color: fg, fontFamily: fontDisplay,
              fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em',
            }}>标记</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: muted, fontSize: 22, padding: '4px 8px',
            fontFamily: fontDisplay, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Tabs — 衬线 + 下划线 */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 14, borderBottom: `1px solid ${border}` }}>
          {tab(markerTab === 'bookmarks', '书签', <BookmarkIcon />, bookmarks.length)}
          {tab(markerTab === 'highlights', '标注', <HighlightIcon />, highlights.length)}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {markerTab === 'bookmarks' && bookmarks.length === 0 && (
            <div style={{ color: muted, fontSize: 13, textAlign: 'center', padding: '32px 0', fontFamily: fontDisplay }}>
              暂无书签<br/>
              <span style={{ fontSize: 11, marginTop: 6, display: 'block', color: colors.textFaint, fontFamily: 'system-ui' }}>阅读时点击底部书签按钮添加</span>
            </div>
          )}
          {markerTab === 'bookmarks' && bookmarks.map(bm => (
            <div key={bm.id} onClick={() => { onNavigate(bm.cfi); onClose() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', cursor: 'pointer',
                background: itemBg,
                border: `1px solid ${border}`,
                borderRadius: 2,
                marginBottom: 6,
                transition: 'background 0.12s',
              }}
            >
              <BookmarkIcon active />
              <span style={{ flex: 1, color: fg, fontSize: 13, fontFamily: 'system-ui', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bm.label || '书签 ' + new Date(bm.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <button onClick={e => { e.stopPropagation(); if (bm.id) onDeleteBookmark(bm.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
              ><TrashIcon /></button>
            </div>
          ))}

          {markerTab === 'highlights' && highlights.length === 0 && (
            <div style={{ color: muted, fontSize: 13, textAlign: 'center', padding: '32px 0', fontFamily: fontDisplay }}>
              选中文本后点击颜色添加标注
            </div>
          )}
          {markerTab === 'highlights' && highlights.map(hl => (
            <div key={hl.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', borderRadius: 2,
                background: itemBg,
                border: `1px solid ${border}`,
                marginBottom: 6,
              }}
            >
              <div style={{
                width: 12, height: 12, background: hl.color,
                flexShrink: 0, marginTop: 4,
                clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))',
                boxShadow: `0 0 6px ${hl.color}60`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: fg, fontSize: 13, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', fontFamily: 'system-ui' }}>
                  "{hl.text}"
                </div>
                {hl.note && (
                  <div style={{ color: muted, fontSize: 11, marginTop: 6, fontStyle: 'italic', fontFamily: fontDisplay }}>— {hl.note}</div>
                )}
              </div>
              <button onClick={() => { if (hl.id) onDeleteHighlight(hl.id, hl.cfiRange) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}
              ><TrashIcon /></button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
