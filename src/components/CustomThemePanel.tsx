import { useState, useEffect } from 'react'
import { CustomTheme, CustomPreset, GradientStop } from '../types'
import { parseRGBA, rgbaToString, getAllPresets, saveCustomPresets, loadCustomPresets } from '../utils/customTheme'
import { colors } from '../utils/styles'

interface Props {
  theme: CustomTheme
  dark: boolean
  onChange: (t: CustomTheme) => void
  onClose: () => void
}

export function CustomThemePanel({ theme, dark, onChange, onClose }: Props) {
  const [presets, setPresets] = useState<CustomPreset[]>([])
  const [editingLabel, setEditingLabel] = useState('')
  const [showPresetInput, setShowPresetInput] = useState(false)
  const [alpha, setAlpha] = useState(1)

  useEffect(() => { loadCustomPresets().then(setPresets) }, [])

  const panelBg = dark ? 'rgba(10,8,7,0.96)' : 'rgba(244,234,213,0.90)'
  const textPrimary = dark ? colors.text : '#3d2b1a'
  const textMuted = dark ? colors.textMuted : 'rgba(61,43,26,0.55)'
  const border = dark ? colors.border : 'rgba(212,146,58,0.20)'
  const chipBg = dark ? 'rgba(240,235,226,0.06)' : 'rgba(61,43,26,0.08)'

  const activeBg = dark ? colors.amberDim : 'rgba(212,146,58,0.15)'
  const activeBorder = dark ? colors.borderAmber : 'rgba(212,146,58,0.35)'

  const chip = (isActive: boolean, label: string, onClick: () => void) => (
    <button onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 600,
        fontFamily: "'Georgia', 'Noto Serif SC', serif",
        background: isActive ? activeBg : chipBg,
        border: `1px solid ${isActive ? activeBorder : border}`,
        color: isActive ? colors.amber : textMuted,
        transition: 'all 0.2s',
      }}
    >{label}</button>
  )

  const allPresets = getAllPresets()
  const builtIn = allPresets.filter(p => !presets.find(cp => cp.label === p.label))

  const applyPreset = (p: CustomPreset) => {
    onChange(p.theme)
    setEditingLabel(p.label)
  }

  const saveAsPreset = async () => {
    const label = editingLabel.trim() || `预设${presets.length + 1}`
    const next = [...presets, { label, theme }]
    setPresets(next)
    await saveCustomPresets(next)
    setShowPresetInput(false)
    setEditingLabel(label)
  }

  const deletePreset = async (label: string) => {
    const next = presets.filter(p => p.label !== label)
    setPresets(next)
    await saveCustomPresets(next)
  }

  const addStop = () => {
    const stops = [...(theme.gradientStops || [])]
    const lastPos = stops.length > 0 ? stops[stops.length - 1].position : 0
    stops.push({ color: `rgba(128,128,128,${alpha})`, position: Math.min(100, lastPos + 25) })
    onChange({ ...theme, type: 'gradient', gradientStops: stops })
  }

  const removeStop = (idx: number) => {
    const stops = (theme.gradientStops || []).filter((_, i) => i !== idx)
    onChange({ ...theme, gradientStops: stops })
  }

  const updateStop = (idx: number, patch: Partial<GradientStop>) => {
    const stops = (theme.gradientStops || []).map((s, i) => i === idx ? { ...s, ...patch } : s)
    onChange({ ...theme, gradientStops: stops })
  }

  const handleColorInput = (color: string) => {
    const [r, g, b] = parseRGBA(color)
    const newColor = rgbaToString(r, g, b, alpha)
    if (theme.type === 'solid') {
      onChange({ ...theme, color: newColor })
    } else {
      const stops = theme.gradientStops || []
      if (stops.length > 0) {
        const updated = [...stops]
        updated[stops.length - 1] = { ...stops[stops.length - 1], color: newColor }
        onChange({ ...theme, gradientStops: updated })
      }
    }
  }

  const previewGradient = () => {
    if (theme.type === 'solid') {
      return theme.color || 'rgba(255,255,255,1)'
    }
    const stops = (theme.gradientStops || []).map(s => `${s.color} ${s.position}%`).join(', ')
    if (!stops) return 'transparent'
    if (theme.gradientType === 'radial') return `radial-gradient(ellipse at center, ${stops})`
    return `linear-gradient(${theme.gradientAngle ?? 135}deg, ${stops})`
  }

  const presetRow = (p: CustomPreset) => (
    <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {chip(editingLabel === p.label, p.label, () => applyPreset(p))}
      <button onClick={() => deletePreset(p.label)}
        style={{ background: 'none', border: 'none', color: colors.red, cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>×</button>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', top: 100, right: 16, zIndex: 20,
      width: 340, maxHeight: '70vh', overflowY: 'auto',
      borderRadius: 2, padding: '20px 22px',
      background: panelBg,
      backdropFilter: 'blur(20px) saturate(140%)',
      WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      border: `1px solid ${border}`,
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column', gap: 14,
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
        fontFamily: "'Georgia', 'Noto Serif SC', serif", fontSize: 6, color: '#0a0807',
        fontWeight: 700, letterSpacing: '0.05em', pointerEvents: 'none',
      }}>THEME</div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: "'Georgia', 'Noto Serif SC', serif", fontSize: 16, fontWeight: 700,
          color: textPrimary, letterSpacing: '-0.01em',
        }}>自定义阅读背景</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontSize: 20, padding: '2px 6px' }}>✕</button>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        {chip(theme.type === 'solid', '纯色', () => onChange({ ...theme, type: 'solid' }))}
        {chip(theme.type === 'gradient', '渐变', () => onChange({ ...theme, type: 'gradient' }))}
      </div>

      {theme.type === 'solid' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="color"
            value={'#' + parseRGBA(theme.color || '#ffffff').slice(0, 3).map((c: number) => c.toString(16).padStart(2, '0')).join('')}
            onChange={e => handleColorInput(e.target.value)}
            style={{ width: 44, height: 32, border: `1px solid ${border}`, cursor: 'pointer', borderRadius: 2, background: 'none' }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: textMuted, whiteSpace: 'nowrap' }}>透明度</span>
            <input type="range" min={70} max={100} value={Math.round(alpha * 100)}
              onChange={e => {
                const a = Number(e.target.value) / 100
                setAlpha(a)
                if (theme.color) {
                  const [r, g, b] = parseRGBA(theme.color)
                  onChange({ ...theme, color: rgbaToString(r, g, b, a) })
                }
              }}
              style={{ flex: 1, accentColor: colors.amber, cursor: 'pointer' }} />
            <span style={{ fontSize: 11, color: textMuted, minWidth: 28 }}>{Math.round(alpha * 100)}%</span>
          </div>
        </div>
      )}

      {theme.type === 'gradient' && (
        <>
          {/* Gradient type + angle */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {chip((theme.gradientType || 'linear') === 'linear', '线性', () => onChange({ ...theme, gradientType: 'linear' }))}
              {chip(theme.gradientType === 'radial', '径向', () => onChange({ ...theme, gradientType: 'radial' }))}
            </div>
            {(theme.gradientType || 'linear') === 'linear' && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: textMuted, whiteSpace: 'nowrap' }}>角度</span>
                <input type="range" min={0} max={360} step={15} value={theme.gradientAngle ?? 135}
                  onChange={e => onChange({ ...theme, gradientAngle: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: colors.amber, cursor: 'pointer' }} />
                <span style={{ fontSize: 11, color: textMuted, minWidth: 28 }}>{theme.gradientAngle ?? 135}°</span>
              </div>
            )}
          </div>

          {/* Built-in presets */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: textMuted, marginBottom: 6 }}>内置渐变</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {builtIn.map(p => chip(false, p.label, () => applyPreset(p)))}
            </div>
          </div>

          {/* My presets */}
          {presets.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: textMuted, marginBottom: 6 }}>我的预设</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {presets.map(presetRow)}
              </div>
            </div>
          )}

          {/* Gradient preview */}
          <div style={{ height: 36, borderRadius: 10, background: previewGradient(), border: `1px solid ${border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />

          {/* Color stops */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: textMuted }}>色标</span>
              <button onClick={addStop}
                style={{ background: 'none', border: `1px solid ${border}`, color: textMuted, cursor: 'pointer', fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>
                + 添加
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(theme.gradientStops || []).map((stop, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="color"
                    value={'#' + parseRGBA(stop.color).slice(0, 3).map((c: number) => c.toString(16).padStart(2, '0')).join('')}
                    onChange={e => {
                      const [r, g, b] = parseRGBA(e.target.value)
                      updateStop(idx, { color: rgbaToString(r, g, b, alpha) })
                    }}
                    style={{ width: 28, height: 24, border: 'none', cursor: 'pointer', borderRadius: 4, background: 'none' }} />
                  <input type="range" min={0} max={100} value={stop.position}
                    onChange={e => updateStop(idx, { position: Number(e.target.value) })}
                    style={{ flex: 1, accentColor: colors.amber, cursor: 'pointer' }} />
                  <span style={{ fontSize: 11, color: textMuted, minWidth: 28 }}>{stop.position}%</span>
                  {(theme.gradientStops || []).length > 2 && (
                    <button onClick={() => removeStop(idx)}
                      style={{ background: 'none', border: 'none', color: colors.red, cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Save as preset */}
      {showPresetInput ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={editingLabel}
            onChange={e => setEditingLabel(e.target.value)}
            placeholder="预设名称"
            onKeyDown={e => { if (e.key === 'Enter') saveAsPreset() }}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: 12,
              background: chipBg, border: `1px solid ${border}`,
              color: textPrimary, outline: 'none',
            }} />
          <button onClick={saveAsPreset}
            style={{
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: colors.amber, border: 'none',
              color: '#0a0807', boxShadow: `0 4px 12px ${colors.amberGlow}`,
            }}>保存</button>
        </div>
      ) : (
        <button onClick={() => setShowPresetInput(true)}
          style={{
            padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12,
            background: chipBg, border: `1px solid ${border}`,
            color: textMuted,
          }}>
          保存当前为预设
        </button>
      )}
    </div>
  )
}
