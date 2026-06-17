import { ReaderLayout, fontFamilies, AnimationMode, ThemeMode } from '../types'
import { colors } from '../utils/styles'

interface LayoutPanelProps {
  visible: boolean
  layout: ReaderLayout
  theme: ThemeMode
  brightness: number
  onLayoutChange: (patch: Partial<ReaderLayout>) => void
  onThemeChange: (t: ThemeMode) => void
  onBrightnessChange: (v: number) => void
  onClose: () => void
}

const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"
const fontBody = "system-ui, -apple-system, 'Segoe UI', sans-serif"

export function LayoutPanel({ visible, layout, theme, brightness, onLayoutChange, onThemeChange, onBrightnessChange, onClose }: LayoutPanelProps) {
  const dark = theme === 'dark' || theme === 'custom'
  const bg = dark ? 'rgba(10,8,7,0.96)' : 'rgba(244,234,213,0.92)'
  const fg = dark ? colors.text : '#3d2b1a'
  const muted = dark ? colors.textMuted : 'rgba(61,43,26,0.5)'
  const border = dark ? colors.border : 'rgba(212,146,58,0.20)'
  const active = dark ? colors.amber : '#a8431e'

  const slider = (label: string, value: number, min: number, max: number, step: number, suffix: string, onChange: (v: number) => void) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: fg, fontFamily: fontDisplay, fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span style={{ color: colors.amber, fontFamily: fontDisplay, fontSize: 14, fontWeight: 600 }}>{value}<span style={{ fontSize: 11, color: muted }}>{suffix}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: colors.amber, height: 3, cursor: 'pointer' }} />
    </div>
  )

  const themeBtn = (t: ThemeMode, label: string) => {
    const isActive = theme === t
    return (
      <button key={t} onClick={() => onThemeChange(t)}
        style={{
          flex: 1, padding: '10px 6px', borderRadius: 2, cursor: 'pointer',
          fontSize: 12, fontWeight: isActive ? 600 : 400,
          fontFamily: fontDisplay, letterSpacing: '0.04em',
          background: isActive ? colors.amberDim : 'transparent',
          border: `1px solid ${isActive ? colors.borderAmber : border}`,
          color: isActive ? colors.amber : muted,
          transition: 'all 0.2s',
        }}
      >{label}</button>
    )
  }

  const chip = (isActive: boolean, label: string, onClick: () => void) => (
    <button onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 2, cursor: 'pointer',
        fontSize: 12, fontWeight: isActive ? 600 : 400,
        fontFamily: fontDisplay,
        background: isActive ? colors.amberDim : 'transparent',
        border: `1px solid ${isActive ? colors.borderAmber : border}`,
        color: isActive ? colors.amber : muted,
        transition: 'all 0.2s',
      }}
    >{label}</button>
  )

  const toggleOn = dark ? colors.amber : '#8a6030'
  const toggleOff = dark ? 'rgba(240,235,226,0.15)' : 'rgba(61,43,26,0.15)'

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        color: fg, fontFamily: fontDisplay, fontSize: 15,
        fontWeight: 600, marginBottom: 12, letterSpacing: '-0.005em',
      }}>{title}</div>
      {children}
    </div>
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
        maxHeight: '70vh', overflowY: 'auto',
        borderTop: `1px solid ${border}`,
      }}>
        {/* corner-cut 印章 */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 24, height: 24,
          background: colors.seal,
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          opacity: 0.85, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 4, right: 4,
          fontFamily: fontDisplay, fontSize: 7, color: '#0a0807',
          fontWeight: 700, letterSpacing: '0.05em', pointerEvents: 'none',
        }}>SET</div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${border}` }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 10, color: colors.amber, letterSpacing: '0.30em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>LAYOUT</div>
            <span style={{ color: fg, fontFamily: fontDisplay, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>排版</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 22, padding: '4px 8px', fontFamily: fontDisplay, lineHeight: 1 }}>✕</button>
        </div>

        <Section title="主题">
          <div style={{ display: 'flex', gap: 8 }}>
            {themeBtn('light', '日')}
            {themeBtn('sepia', '纸')}
            {themeBtn('dark', '墨')}
            {themeBtn('custom', '自定义')}
          </div>
        </Section>

        <Section title="显示">
          {slider('亮度', brightness, 20, 200, 5, '%', onBrightnessChange)}
          {slider('字号', layout.fontSize, 75, 200, 5, '%', v => onLayoutChange({ fontSize: v }))}
          {slider('字重', layout.fontWeight, 300, 700, 100, '', v => onLayoutChange({ fontWeight: v }))}
          {slider('行高', Math.round(layout.lineHeight * 10), 10, 25, 1, '', v => onLayoutChange({ lineHeight: v / 10 }))}
          {slider('边距', layout.margin, 0, 40, 5, 'px', v => onLayoutChange({ margin: v }))}
        </Section>

        <Section title="字体">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {fontFamilies.map(f => chip(layout.fontFamily === f.value, f.label, () => onLayoutChange({ fontFamily: f.value })))}
          </div>
        </Section>

        <Section title="阅读方式">
          <div style={{ display: 'flex', gap: 8 }}>
            {chip(layout.flow !== 'scrolled-doc', '分页', () => onLayoutChange({ flow: 'paginated' }))}
            {chip(layout.flow === 'scrolled-doc', '滚动', () => onLayoutChange({ flow: 'scrolled-doc' }))}
          </div>
        </Section>

        <Section title="翻页动画">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {chip(layout.animationMode === 'slide', '滑动', () => onLayoutChange({ animationMode: 'slide' }))}
            {chip(layout.animationMode === 'fade', '淡入', () => onLayoutChange({ animationMode: 'fade' }))}
            {chip(layout.animationMode === 'blur-focus', '模糊', () => onLayoutChange({ animationMode: 'blur-focus' }))}
            {chip(layout.animationMode === 'slide-fade', '滑淡', () => onLayoutChange({ animationMode: 'slide-fade' }))}
          </div>
        </Section>

        <Section title="性能与设备">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* reduced motion toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: fg, fontFamily: fontDisplay, fontSize: 13, fontWeight: 500 }}>低性能模式</span>
              <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!layout.reducedMotion}
                  onChange={e => onLayoutChange({ reducedMotion: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 2,
                  background: layout.reducedMotion ? toggleOn : toggleOff,
                  transition: 'all 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: layout.reducedMotion ? 20 : 2, width: 18, height: 18,
                    borderRadius: 2, background: '#fff',
                    transition: 'all 0.2s',
                  }} />
                </span>
              </label>
            </div>
            {/* media key toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: fg, fontFamily: fontDisplay, fontSize: 13, fontWeight: 500 }}>蓝牙翻页</span>
              <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer' }}>
                <input type="checkbox" checked={layout.enableMediaKey !== false}
                  onChange={e => onLayoutChange({ enableMediaKey: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 2,
                  background: layout.enableMediaKey !== false ? toggleOn : toggleOff,
                  transition: 'all 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: layout.enableMediaKey !== false ? 20 : 2, width: 18, height: 18,
                    borderRadius: 2, background: '#fff',
                    transition: 'all 0.2s',
                  }} />
                </span>
              </label>
            </div>
          </div>
        </Section>
      </div>
    </>
  )
}
