import { btnGlass } from '../utils/styles'

type LibPage = 'books' | 'stats' | 'settings'

interface SidebarNavProps {
  libPage: LibPage
  onSwitchPage: (target: LibPage) => void
}

const navBtn = (active: boolean, page: LibPage, libPage: LibPage): React.CSSProperties => ({
  ...btnGlass, padding: '6px 14px', fontSize: 15, textAlign: 'center',
  background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(168,85,247,0.25))' : 'transparent',
  border: active ? '1px solid rgba(168,85,247,0.35)' : '1px solid transparent',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  color: active ? '#fff' : 'rgba(255,255,255,0.8)',
  borderRadius: 14,
  minWidth: 56,
})

const hoverStyle = (e: React.MouseEvent, active: boolean) => {
  const el = e.currentTarget as HTMLElement
  if (!active) el.style.background = 'rgba(255,255,255,0.12)'
}
const leaveStyle = (e: React.MouseEvent, active: boolean) => {
  const el = e.currentTarget as HTMLElement
  if (!active) el.style.background = 'transparent'
}

export function SidebarNav({ libPage, onSwitchPage }: SidebarNavProps) {
  return (
    <div style={{
      height: 72, display: 'flex', flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, zIndex: 2,
      background: 'transparent',
      borderTop: 'none',
      paddingBottom: 'env(safe-area-inset-bottom, 4px)',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 12,
        margin: '0 16px',
        padding: '6px 8px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: 360,
      }}>
        <button onClick={() => onSwitchPage('books')}
          style={navBtn(libPage === 'books', 'books', libPage)}
          onMouseEnter={e => hoverStyle(e, libPage === 'books')}
          onMouseLeave={e => leaveStyle(e, libPage === 'books')}
        >
          <span style={{ fontSize: 20, lineHeight: 1.2 }}>📚</span>
          <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.9, whiteSpace: 'nowrap' }}>书架</span>
        </button>
        <button onClick={() => onSwitchPage('stats')}
          style={navBtn(libPage === 'stats', 'stats', libPage)}
          onMouseEnter={e => hoverStyle(e, libPage === 'stats')}
          onMouseLeave={e => leaveStyle(e, libPage === 'stats')}
        >
          <span style={{ fontSize: 20, lineHeight: 1.2 }}>📊</span>
          <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.9, whiteSpace: 'nowrap' }}>统计</span>
        </button>
        <button onClick={() => onSwitchPage('settings')}
          style={navBtn(libPage === 'settings', 'settings', libPage)}
          onMouseEnter={e => hoverStyle(e, libPage === 'settings')}
          onMouseLeave={e => leaveStyle(e, libPage === 'settings')}
        >
          <span style={{ fontSize: 20, lineHeight: 1.2 }}>⚙</span>
          <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.9, whiteSpace: 'nowrap' }}>设置</span>
        </button>
      </div>
    </div>
  )
}
