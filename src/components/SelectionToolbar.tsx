import { highlightColors } from '../types'

interface SelectionToolbarProps {
  visible: boolean
  bounds: { top: number; left: number; width: number; height: number } | null
  onSelectColor: (color: string) => void
  onClear: () => void
}

export function SelectionToolbar({ visible, bounds, onSelectColor, onClear }: SelectionToolbarProps) {
  if (!visible || !bounds) return null

  const toolbarStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.max(8, bounds.top - 50),
    left: bounds.left + bounds.width / 2,
    transform: 'translateX(-50%)',
    zIndex: 20,
    display: 'flex',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 14,
    background: 'rgba(15,12,41,0.9)',
    backdropFilter: 'blur(16px) saturate(140%)',
    WebkitBackdropFilter: 'blur(16px) saturate(140%)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  }

  return (
    <div style={toolbarStyle}>
      {highlightColors.map(hc => (
        <button key={hc.key}
          onClick={() => onSelectColor(hc.color)}
          style={{
            width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
            background: hc.color, border: '2px solid rgba(255,255,255,0.2)',
            transition: 'transform 0.1s',
            padding: 0,
          }}
          title={hc.label}
        />
      ))}
      <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 4px' }} />
      <button onClick={onClear}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.4)', fontSize: 16, padding: '0 2px',
        }}
        title="取消"
      >✕</button>
    </div>
  )
}
