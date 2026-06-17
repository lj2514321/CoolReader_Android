import { colors } from '../utils/styles'

type LibPage = 'books' | 'stats' | 'settings'

interface SidebarNavProps {
  libPage: LibPage
  onSwitchPage: (target: LibPage) => void
}

const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"

/* Lucide-style inline SVGs — 1.5px stroke, round caps, 24×24 viewBox */
const BookOpenIcon = ({ size = 22, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)

const BarChartIcon = ({ size = 22, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)

const SettingsIcon = ({ size = 22, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const NAV_ITEMS: { key: LibPage; label: string; Icon: (p: { size?: number; stroke?: string }) => JSX.Element }[] = [
  { key: 'books',  label: '书架',  Icon: BookOpenIcon },
  { key: 'stats',  label: '统计',  Icon: BarChartIcon },
  { key: 'settings', label: '设置', Icon: SettingsIcon },
]

export function SidebarNav({ libPage, onSwitchPage }: SidebarNavProps) {
  return (
    <div style={{
      height: 80,
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
      paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
      background: 'rgba(10, 8, 7, 0.85)',
      backdropFilter: 'blur(16px) saturate(140%)',
      WebkitBackdropFilter: 'blur(16px) saturate(140%)',
      borderTop: `1px solid ${colors.border}`,
      position: 'relative',
    }}>
      {/* corner-cut 印章 */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        width: 6, height: 6,
        background: colors.seal, opacity: 0.4,
        clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
      }} />
      {/* Tab strip — borderless, underline indicator */}
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-around',
        margin: '0 24px',
        width: '100%', maxWidth: 360,
        gap: 0,
      }}>
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const active = libPage === key
          return (
            <button
              key={key}
              onClick={() => onSwitchPage(key)}
              title={label}
              style={{
                flex: 1,
                padding: '10px 8px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                color: active ? colors.amber : colors.textMuted,
                position: 'relative',
                transition: 'color 0.2s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <Icon size={20} stroke={active ? colors.amber : 'currentColor'} />
              <span style={{
                fontFamily: fontDisplay,
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.05em',
                lineHeight: 1,
              }}>
                {label}
              </span>
              {/* underline indicator */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: `translateX(-50%) scaleX(${active ? 1 : 0})`,
                width: 18, height: 2,
                background: active ? colors.amber : 'transparent',
                boxShadow: active ? `0 0 8px ${colors.amberGlow}` : 'none',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
