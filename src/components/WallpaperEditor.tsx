import { useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import type { CustomBgConfig, CustomTheme, GradientStop, GradientType } from '../types'
import { presetGradients } from '../types'
import { bgPresets } from '../utils/styles'

/**
 * Custom home-page wallpaper editor. Mirrors src/components/WallpaperEditor.tsx
 * in the source project (coolreader v1.5.x) but tuned for the mobile target:
 *  - Four tabs: 预设 / 纯色 / 渐变 / 图片
 *  - Image uploads read the file with FileReader, then store base64 in customBg.imageData.
 *    IndexedDB has plenty of room but a 1MB image is still ~1.4MB base64 — UI displays
 *    a friendly warning before persisting.
 *  - Gradient editor exposes type (linear/radial), angle, and ≥2 color stops.
 *
 * The component is fully controlled — it never owns the `customBg` state and never
 * writes to IndexedDB itself. The parent owns both.
 */

interface WallpaperEditorProps {
  /** Current wallpaper. Defaults to a deepPurple preset. */
  config: CustomBgConfig
  /** Triggered on any tab interaction. Parent decides whether to persist. */
  onChange: (config: CustomBgConfig) => void
}

type Tab = 'preset' | 'color' | 'gradient' | 'image'

const TAB_LABELS: Record<Tab, string> = {
  preset: '预设',
  color: '纯色',
  gradient: '渐变',
  image: '图片',
}

export function WallpaperEditor({ config, onChange }: WallpaperEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preset')

  return (
    <div style={styles.container}>
      <div style={styles.tabBar}>
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'preset' && <PresetTab config={config} onChange={onChange} />}
        {activeTab === 'color' && <ColorTab config={config} onChange={onChange} />}
        {activeTab === 'gradient' && <GradientTab config={config} onChange={onChange} />}
        {activeTab === 'image' && <ImageTab config={config} onChange={onChange} />}
      </div>
    </div>
  )
}

/* ---------- Preset tab ---------- */

function PresetTab({ config, onChange }: WallpaperEditorProps) {
  return (
    <div style={styles.presetGrid}>
      {bgPresets.map(p => {
        const isActive = config.type === 'preset' && config.presetKey === p.key
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange({ type: 'preset', presetKey: p.key })}
            style={{
              ...styles.presetBtn,
              background: p.gradient,
              ...(isActive ? styles.presetBtnActive : {}),
            }}
            title={p.label}
          >
            <span style={styles.presetBtnLabel}>{p.label}</span>
            {isActive && <span style={styles.checkmark}>✓</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Color tab ---------- */

function ColorTab({ config, onChange }: WallpaperEditorProps) {
  const initial = config.type === 'color' && config.color ? config.color : '#3b82f6'
  const hexFromColor = (color: string): string => {
    if (color.startsWith('#')) return color
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!m) return '#3b82f6'
    const [, r, g, b] = m
    return '#' + [r, g, b].map(n => Number(n).toString(16).padStart(2, '0')).join('')
  }
  const alphaFromColor = (color: string): number => {
    const m = color.match(/rgba?\([^)]+,\s*([\d.]+)\s*\)/)
    if (!m) return 1
    return Number(m[1])
  }
  const [color, setColor] = useState(hexFromColor(initial))
  const [alpha, setAlpha] = useState(Math.round(alphaFromColor(initial) * 100))

  const commit = useCallback((nextHex: string, nextAlpha: number) => {
    const r = parseInt(nextHex.slice(1, 3), 16)
    const g = parseInt(nextHex.slice(3, 5), 16)
    const b = parseInt(nextHex.slice(5, 7), 16)
    onChange({ type: 'color', color: `rgba(${r},${g},${b},${(nextAlpha / 100).toFixed(2)})` })
  }, [onChange])

  return (
    <div style={styles.section}>
      <div style={styles.row}>
        <span style={styles.label}>颜色</span>
        <input
          type="color"
          value={color}
          onChange={e => { setColor(e.target.value); commit(e.target.value, alpha) }}
          style={styles.colorPicker}
        />
        <span style={styles.valueText}>{color.toUpperCase()}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>透明度</span>
        <input
          type="range"
          min={70} max={100} step={1}
          value={alpha}
          onChange={e => { const v = Number(e.target.value); setAlpha(v); commit(color, v) }}
          style={styles.slider}
        />
        <span style={styles.valueText}>{alpha}%</span>
      </div>
      <div
        style={{
          ...styles.previewSwatch,
          background: `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${alpha / 100})`,
        }}
      />
    </div>
  )
}

/* ---------- Gradient tab ---------- */

function GradientTab({ config, onChange }: WallpaperEditorProps) {
  const initialStops = config.gradient?.gradientStops ?? presetGradients[0].stops
  const initialType = config.gradient?.gradientType ?? 'linear'
  const initialAngle = config.gradient?.gradientAngle ?? 135

  const [gradientType, setGradientType] = useState<GradientType>(initialType)
  const [angle, setAngle] = useState<number>(initialAngle)
  const [stops, setStops] = useState<GradientStop[]>(initialStops)

  const emit = useCallback((nextType: GradientType, nextAngle: number, nextStops: GradientStop[]) => {
    const theme: CustomTheme = {
      type: 'gradient',
      gradientType: nextType,
      gradientAngle: nextAngle,
      gradientStops: nextStops,
    }
    onChange({ type: 'gradient', gradient: theme })
  }, [onChange])

  const setType = (t: GradientType) => { setGradientType(t); emit(t, angle, stops) }
  const setAngleValue = (a: number) => { setAngle(a); emit(gradientType, a, stops) }
  const updateStop = (idx: number, patch: Partial<GradientStop>) => {
    const next = stops.map((s, i) => i === idx ? { ...s, ...patch } : s)
    setStops(next); emit(gradientType, angle, next)
  }
  const addStop = () => {
    if (stops.length >= 6) return
    const last = stops[stops.length - 1]
    const next = [...stops, { color: 'rgba(128,128,128,0.85)', position: Math.min(100, (last?.position ?? 0) + 20) }]
    setStops(next); emit(gradientType, angle, next)
  }
  const removeStop = (idx: number) => {
    if (stops.length <= 2) return
    const next = stops.filter((_, i) => i !== idx)
    setStops(next); emit(gradientType, angle, next)
  }

  const previewCss = (() => {
    const stopsStr = stops.map(s => `${s.color} ${s.position}%`).join(', ')
    if (gradientType === 'radial') return `radial-gradient(ellipse at center, ${stopsStr})`
    return `linear-gradient(${angle}deg, ${stopsStr})`
  })()

  const hexFromStop = (color: string): string => {
    if (color.startsWith('#')) return color
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!m) return '#000000'
    return '#' + [m[1], m[2], m[3]].map(n => Number(n).toString(16).padStart(2, '0')).join('')
  }

  return (
    <div style={styles.section}>
      <div style={styles.row}>
        <span style={styles.label}>类型</span>
        <div style={styles.toggleGroup}>
          {(['linear', 'radial'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              style={{ ...styles.toggleBtn, ...(gradientType === t ? styles.toggleBtnActive : {}) }}
            >
              {t === 'linear' ? '线性' : '径向'}
            </button>
          ))}
        </div>
      </div>

      {gradientType === 'linear' && (
        <div style={styles.row}>
          <span style={styles.label}>角度</span>
          <input
            type="range" min={0} max={360} step={5}
            value={angle}
            onChange={e => setAngleValue(Number(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.valueText}>{angle}°</span>
        </div>
      )}

      <div style={styles.stopList}>
        {stops.map((s, idx) => (
          <div key={idx} style={styles.stopRow}>
            <input
              type="color"
              value={hexFromStop(s.color)}
              onChange={e => updateStop(idx, { color: e.target.value })}
              style={styles.colorPickerSmall}
            />
            <input
              type="range" min={0} max={100} step={1}
              value={s.position}
              onChange={e => updateStop(idx, { position: Number(e.target.value) })}
              style={{ ...styles.slider, flex: 1 }}
            />
            <span style={styles.valueText}>{s.position}%</span>
            {stops.length > 2 && (
              <button type="button" onClick={() => removeStop(idx)} style={styles.removeBtn}>×</button>
            )}
          </div>
        ))}
        {stops.length < 6 && (
          <button type="button" onClick={addStop} style={styles.addStopBtn}>+ 添加色标</button>
        )}
      </div>

      <div style={{ ...styles.previewSwatch, background: previewCss }} />

      <div style={styles.presetLabel}>内置渐变</div>
      <div style={styles.presetRow}>
        {presetGradients.map(p => {
          const stopsStr = p.stops.map(s => `${s.color} ${s.position}%`).join(', ')
          const preview = p.type === 'radial'
            ? `radial-gradient(ellipse at center, ${stopsStr})`
            : `linear-gradient(${p.angle}deg, ${stopsStr})`
          return (
            <button
              key={p.label}
              type="button"
              title={p.label}
              onClick={() => { setGradientType(p.type); setAngle(p.angle); setStops(p.stops); emit(p.type, p.angle, p.stops) }}
              style={{ ...styles.presetMini, background: preview }}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Image tab ---------- */

function ImageTab({ config, onChange }: WallpaperEditorProps) {
  const [error, setError] = useState<string>('')

  const handleFile = useCallback((file: File) => {
    setError('')
    // Cap at 2 MB before base64 expansion (~2.8 MB persisted).
    if (file.size > 2 * 1024 * 1024) {
      setError('图片过大（>2MB），请压缩后再试')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      if (typeof dataUrl !== 'string') {
        setError('读取失败')
        return
      }
      onChange({ type: 'image', imageData: dataUrl, imageFit: 'cover' })
    }
    reader.onerror = () => setError('读取失败')
    reader.readAsDataURL(file)
  }, [onChange])

  return (
    <div style={styles.section}>
      {config.type === 'image' && config.imageData ? (
        <>
          <div style={{
            ...styles.previewSwatch,
            backgroundImage: `url(${config.imageData})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
          <button
            type="button"
            onClick={() => onChange({ type: 'preset', presetKey: 'deepPurple' })}
            style={styles.removeBtnWide}
          >
            移除图片
          </button>
        </>
      ) : (
        <label style={styles.uploadBtn}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />
          📷 上传图片（≤2MB）
        </label>
      )}
      {error && <div style={styles.errorText}>{error}</div>}
    </div>
  )
}

/* ---------- styles ---------- */

const styles: Record<string, CSSProperties> = {
  container: {
    background: 'rgba(10,8,7,0.85)',
    border: '1px solid rgba(212,146,58,0.20)',
    borderRadius: 14,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  tabBar: {
    display: 'flex',
    gap: 4,
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: '8px 4px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    background: 'rgba(212,146,58,0.30)',
    color: '#d4923a',
    boxShadow: '0 0 10px rgba(212,146,58,0.30)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    minWidth: 56,
  },
  valueText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    minWidth: 40,
    textAlign: 'right',
  },
  colorPicker: {
    width: 56,
    height: 32,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    padding: 0,
    background: 'transparent',
  },
  colorPickerSmall: {
    width: 36,
    height: 28,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    padding: 0,
    background: 'transparent',
  },
  slider: {
    flex: 1,
    height: 4,
    accentColor: '#8b5cf6',
  },
  previewSwatch: {
    height: 60,
    borderRadius: 10,
    width: '100%',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  presetBtn: {
    height: 60,
    border: '2px solid transparent',
    borderRadius: 10,
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 4,
  },
  presetBtnActive: {
    borderColor: 'rgba(139,92,246,0.8)',
  },
  presetBtnLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 600,
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 6,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  toggleGroup: {
    display: 'flex',
    gap: 4,
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    padding: 3,
    flex: 1,
  },
  toggleBtn: {
    flex: 1,
    padding: '6px 8px',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  toggleBtnActive: {
    background: 'rgba(212,146,58,0.30)',
    color: '#d4923a',
  },
  stopList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  removeBtn: {
    width: 26,
    height: 26,
    border: 'none',
    borderRadius: 6,
    background: 'rgba(239,68,68,0.3)',
    color: '#ef4444',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStopBtn: {
    padding: '6px 12px',
    border: '1px dashed rgba(255,255,255,0.25)',
    borderRadius: 8,
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  presetLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  presetRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  presetMini: {
    width: 40,
    height: 32,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  uploadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 12px',
    border: '2px dashed rgba(255,255,255,0.2)',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'center',
  },
  removeBtnWide: {
    padding: '10px 16px',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 8,
    background: 'rgba(239,68,68,0.15)',
    color: '#fca5a5',
    fontSize: 13,
    cursor: 'pointer',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
  },
}
