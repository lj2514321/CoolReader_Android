import { useEffect, useRef } from 'react'
import { NavItem } from '../types'

interface SidebarProps {
  visible: boolean
  toc: NavItem[]
  currentHref: string
  dark: boolean
  onNavigate: (href: string) => void
  onClose: () => void
}

export function Sidebar({ visible, toc, currentHref, dark, onNavigate, onClose }: SidebarProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return
    const active = ref.current?.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [visible])

  const bg = dark ? '#0f0c29e0' : '#f0ecf8e0'
  const fg = dark ? '#c8c8e0' : '#2d2b55'
  const muted = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'
  const activeBg = dark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)'

  const renderItem = (item: NavItem, depth: number = 0) => {
    const active = item.href === currentHref
    return (
      <div key={item.href}>
        <div
          onClick={() => { onNavigate(item.href); onClose() }}
          data-active={active || undefined}
          style={{
            padding: '10px 16px 10px ' + (20 + depth * 16) + 'px',
            cursor: 'pointer',
            borderRadius: 8,
            margin: '2px 8px',
            background: active ? activeBg : 'transparent',
            borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
            color: active ? '#6366f1' : fg,
            fontWeight: active ? 700 : 400,
            fontSize: 13,
            transition: 'all 0.12s',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >{item.label}</div>
        {item.subitems?.map(sub => renderItem(sub, depth + 1))}
      </div>
    )
  }

  return (
    <>
      {visible && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 10,
            background: 'rgba(0,0,0,0.3)',
          }}
        />
      )}
      <div ref={ref} style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 11,
        width: 'min(320px, 80vw)',
        background: bg,
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 8px',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: fg }}>目录</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: muted, fontSize: 20, padding: '4px 8px',
          }}>✕</button>
        </div>

        {toc.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: muted, fontSize: 13 }}>无目录</div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', padding: '4px 0 16px' }}>
            {toc.map(item => renderItem(item))}
          </div>
        )}
      </div>
    </>
  )
}
