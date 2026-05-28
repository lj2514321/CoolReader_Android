import { ReaderLayout, fontFamilies, AnimationMode, ThemeMode } from '../types'

interface LayoutPanelProps {
  visible: boolean
  layout: ReaderLayout
  dark: boolean
  theme: ThemeMode
  brightness: number
  onLayoutChange: (patch: Partial<ReaderLayout>) => void
  onThemeChange: (t: ThemeMode) => void
  onBrightnessChange: (v: number) => void
  onClose: () => void
}

export function LayoutPanel({ visible, layout, dark, theme, brightness, onLayoutChange, onThemeChange, onBrightnessChange, onClose }: LayoutPanelProps) {
  const bg = dark ? '#0f0c29e0' : '#f0ecf8e0'
  const fg = dark ? '#c8c8e0' : '#2d2b55'
  const muted = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'
  const trackBg = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const fillBg = 'linear-gradient(90deg, #6366f1, #a855f7)'

  const slider = (label: string, value: number, min: number, max: number, step: number, suffix: string, onChange: (v: number) => void) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: fg, fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ color: muted, fontSize: 12 }}>{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#6366f1', height: 4, cursor: 'pointer' }} />
    </div>
  )

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
        maxHeight: '70vh', overflow: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ color: fg, fontSize: 16, fontWeight: 700 }}>主题设置</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 20, padding: '4px 8px' }}>✕</button>
        </div>

        {/* theme buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['light', 'sepia', 'dark', 'custom'] as ThemeMode[]).map(t => (
            <button key={t} onClick={() => onThemeChange(t)}
              style={{
                flex: 1, padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: theme === t ? 'rgba(99,102,241,0.3)' : 'transparent',
                border: `1px solid ${theme === t ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: theme === t ? '#6366f1' : fg,
              }}
            >{t === 'light' ? '☀' : t === 'sepia' ? '☕' : t === 'dark' ? '◉' : '🎨'}</button>
          ))}
        </div>

        {/* brightness slider */}
        {slider('亮度', brightness, 20, 200, 5, '%', onBrightnessChange)}

        {/* separator */}
        <div style={{ height: 1, background: muted, margin: '12px 0' }} />

        {slider('字号', layout.fontSize, 75, 200, 5, '%', v => onLayoutChange({ fontSize: v }))}
        {slider('字重', layout.fontWeight, 300, 700, 100, '', v => onLayoutChange({ fontWeight: v }))}
        {slider('行高', layout.lineHeight * 10, 10, 25, 1, '', v => onLayoutChange({ lineHeight: v / 10 }))}
        {slider('边距', layout.margin, 0, 40, 5, 'px', v => onLayoutChange({ margin: v }))}

        {/* font family */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: fg, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>字体</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {fontFamilies.map(f => (
              <button key={f.value} onClick={() => onLayoutChange({ fontFamily: f.value })}
                style={{
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  background: layout.fontFamily === f.value ? 'rgba(99,102,241,0.3)' : 'transparent',
                  border: `1px solid ${layout.fontFamily === f.value ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: layout.fontFamily === f.value ? '#6366f1' : fg,
                }}
              >{f.label}</button>
            ))}
          </div>
        </div>

        {/* flow toggle */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {[{ key: 'paginated' as const, label: '📄 分页' }, { key: 'scrolled-doc' as const, label: '📜 滚动' }].map(f => (
            <button key={f.key} onClick={() => onLayoutChange({ flow: f.key })}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: layout.flow === f.key ? 'rgba(99,102,241,0.3)' : 'transparent',
                border: `1px solid ${layout.flow === f.key ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: layout.flow === f.key ? '#6366f1' : fg,
              }}
            >{f.label}</button>
          ))}
        </div>

        {/* animation mode */}
        <div style={{ marginTop: 14, marginBottom: 10 }}>
          <div style={{ color: fg, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>翻页动画</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([{ key: 'slide' as AnimationMode, label: '📦 滑动' }, { key: 'fade' as AnimationMode, label: '🌫 淡入' }, { key: 'blur-focus' as AnimationMode, label: '🌀 模糊' }, { key: 'slide-fade' as AnimationMode, label: '🎭 滑淡' }]).map(m => (
              <button key={m.key} onClick={() => onLayoutChange({ animationMode: m.key })}
                style={{
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  background: (layout.animationMode || 'slide') === m.key ? 'rgba(99,102,241,0.3)' : 'transparent',
                  border: `1px solid ${(layout.animationMode || 'slide') === m.key ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: (layout.animationMode || 'slide') === m.key ? '#6366f1' : fg,
                }}
              >{m.label}</button>
            ))}
          </div>
        </div>

        {/* reduced motion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 2 }}>
          <span style={{ color: fg, fontSize: 12, fontWeight: 600 }}>⚡ 低性能模式</span>
          <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!layout.reducedMotion}
              onChange={e => onLayoutChange({ reducedMotion: e.target.checked })}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: 11,
              background: layout.reducedMotion ? '#6366f1' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.2s',
            }}>
              <span style={{
                position: 'absolute', top: 2, left: layout.reducedMotion ? 20 : 2, width: 18, height: 18,
                borderRadius: '50%', background: '#fff', transition: 'all 0.2s',
              }} />
            </span>
          </label>
          <span style={{ color: muted, fontSize: 11 }}>减弱动画</span>
        </div>

        {/* media key */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 2 }}>
          <span style={{ color: fg, fontSize: 12, fontWeight: 600 }}>🎧 蓝牙翻页</span>
          <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer' }}>
            <input type="checkbox" checked={layout.enableMediaKey !== false}
              onChange={e => onLayoutChange({ enableMediaKey: e.target.checked })}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: 11,
              background: (layout.enableMediaKey !== false) ? '#6366f1' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.2s',
            }}>
              <span style={{
                position: 'absolute', top: 2, left: (layout.enableMediaKey !== false) ? 20 : 2, width: 18, height: 18,
                borderRadius: '50%', background: '#fff', transition: 'all 0.2s',
              }} />
            </span>
          </label>
          <span style={{ color: muted, fontSize: 11 }}>蓝牙耳机/键盘翻页</span>
        </div>
      </div>
    </>
  )
}
