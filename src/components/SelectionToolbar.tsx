import { highlightColors } from '../types'
import { colors } from '../utils/styles'

interface SelectionToolbarProps {
  visible: boolean
  theme?: string
  bounds: { top: number; left: number; width: number; height: number } | null
  onSelectColor: (color: string) => void
  onClear: () => void
}

export function SelectionToolbar({ visible, theme = 'dark', bounds, onSelectColor, onClear }: SelectionToolbarProps) {
  if (!visible || !bounds) return null

  const dark = theme === 'dark' || theme === 'custom'

  const toolbarStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.max(8, bounds.top - 50),
    left: bounds.left + bounds.width / 2,
    transform: 'translateX(-50%)',
    zIndex: 20,
    display: 'flex',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 2,
    background: dark ? 'rgba(10,8,7,0.97)' : 'rgba(244,234,213,0.95)',
    backdropFilter: 'blur(20px) saturate(140%)',
    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
    border: `1px solid ${dark ? 'rgba(212,146,58,0.25)' : 'rgba(212,146,58,0.30)'}`,
    boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)',
  }

  return (
    <div style={toolbarStyle}>
      {highlightColors.map(hc => (
        <button key={hc.key}
          onClick={() => onSelectColor(hc.color)}
          style={{
            width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
            background: hc.color, border: `2px solid ${colors.border}`,
            transition: 'transform 0.1s, box-shadow 0.1s',
            padding: 0, boxShadow: `0 0 6px ${hc.color}80`,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
          title={hc.label}
        />
      ))}
      <div style={{ width: 1, background: colors.border, margin: '2px 4px' }} />
      <button onClick={onClear}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.textMuted, fontSize: 16, padding: '0 2px',
        }}
        title="取消"
      >✕</button>
    </div>
  )
}
