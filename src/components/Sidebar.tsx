import { useEffect, useRef } from 'react'
import { NavItem } from '../types'
import { colors } from '../utils/styles'

interface SidebarProps {
  visible: boolean
  toc: NavItem[]
  currentHref: string
  theme: string
  onNavigate: (href: string) => void
  onClose: () => void
}

const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"

export function Sidebar({ visible, toc, currentHref, theme, onNavigate, onClose }: SidebarProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return
    const active = ref.current?.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [visible])

  const dark = theme === 'dark' || theme === 'custom'
  const bg = dark ? 'rgba(10,8,7,0.96)' : 'rgba(244,234,213,0.95)'
  const fg = dark ? colors.text : '#3d2b1a'
  const muted = dark ? colors.textMuted : 'rgba(61,43,26,0.5)'

  const renderItem = (item: NavItem, depth: number = 0) => {
    const active = item.href === currentHref
    return (
      <div key={item.href}>
        <div
          onClick={() => { onNavigate(item.href); onClose() }}
          data-active={active || undefined}
          style={{
            padding: '11px 16px 11px ' + (16 + depth * 18) + 'px',
            cursor: 'pointer',
            background: active ? (dark ? colors.amberDim : 'rgba(212,146,58,0.10)') : 'transparent',
            borderLeft: `2px solid ${active ? colors.amber : 'transparent'}`,
            color: active ? (dark ? colors.amber : '#a8431e') : fg,
            fontFamily: fontDisplay,
            fontWeight: active ? 600 : 400,
            fontSize: depth === 0 ? 14 : 13,
            transition: 'all 0.12s',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: depth === 0 ? '-0.005em' : '0',
          }}
        >{item.label}</div>
        {item.subitems?.map(sub => renderItem(sub, depth + 1))}
      </div>
    )
  }

  return (
    <>
      {visible && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, zIndex: 10,
          background: 'rgba(10,8,7,0.4)',
        }} />
      )}
      <div ref={ref} style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 11,
        width: 'min(320px, 82vw)',
        background: bg,
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        borderRight: `1px solid ${dark ? colors.border : colors.borderAmber}`,
      }}>
        {/* Header — 衬线大标题 + 印章红 corner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: `1px solid ${dark ? colors.border : colors.borderAmber}`,
          position: 'relative',
        }}>
          <div>
            <div style={{
              fontFamily: fontDisplay,
              fontSize: 10,
              color: colors.amber,
              letterSpacing: '0.30em',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              CONTENTS
            </div>
            <span style={{
              fontFamily: fontDisplay,
              fontSize: 22,
              fontWeight: 700,
              color: fg,
              letterSpacing: '-0.01em',
            }}>目录</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: muted, fontSize: 22, padding: '4px 8px',
            fontFamily: fontDisplay,
            lineHeight: 1,
          }}>✕</button>
          <div style={{
            position: 'absolute', top: 12, left: 12,
            width: 6, height: 6,
            background: colors.seal, opacity: 0.6,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
          }} />
        </div>

        {toc.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: muted, fontSize: 13, fontFamily: fontDisplay }}>无目录</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 24px' }}>
            {toc.map(item => renderItem(item))}
          </div>
        )}
      </div>
    </>
  )
}
