/**
 * styles.ts — mirrors CSS token values as JS constants.
 * Components use CSS classes from glass.css / typography.css where possible,
 * but for inline styles (React inline `style={{...}}`) we need JS values.
 * Keep the two in sync by having this file re-export the CSS vars as a JS map.
 */

import type { CSSProperties } from 'react'

/* ── 暖夜读 方向 A 配色 ────────────────────────── */
export const colors = {
  bg:           '#0a0807',
  bgRaised:     '#13100c',
  bgFloat:      '#1c1710',
  amber:        '#d4923a',
  amberDim:     'rgba(212, 146, 58, 0.15)',
  amberGlow:    'rgba(212, 146, 58, 0.35)',
  paper:        '#f4ead5',
  paperDim:     'rgba(244, 234, 213, 0.08)',
  paperMuted:   'rgba(244, 234, 213, 0.55)',
  green:        '#7aaa6e',
  red:          '#c0544a',
  text:         '#f0ebe2',
  textMuted:    'rgba(240, 235, 226, 0.55)',
  textFaint:    'rgba(240, 235, 226, 0.28)',
  border:       'rgba(240, 235, 226, 0.10)',
  borderAmber:  'rgba(212, 146, 58, 0.30)',
  glassBg:      'rgba(28, 23, 16, 0.72)',
  glassBgLight: 'rgba(244, 234, 213, 0.85)',
}

/* ── 渐变预设（书架背景 / 全局背景） ─────────── */
export const defGrad = 'linear-gradient(160deg, #0a0807 0%, #13100c 50%, #1c1710 100%)'

export const bgPresets = [
  { key: 'warmBlack',  label: '暖夜',    gradient: 'linear-gradient(160deg, #0a0807 0%, #13100c 50%, #1c1710 100%)',  glassBg: 'rgba(28, 23, 16, 0.72)' },
  { key: 'deepAmber',  label: '琥珀',    gradient: 'linear-gradient(160deg, #1c1408 0%, #2d1e0a 50%, #1a1208 100%)',  glassBg: 'rgba(36, 24, 10, 0.72)' },
  { key: 'ink',         label: '墨色',    gradient: 'linear-gradient(160deg, #0f0e0c 0%, #1a1814 50%, #0f0d0a 100%)',  glassBg: 'rgba(20, 18, 14, 0.72)' },
  { key: 'darkForest',  label: '暗林',    gradient: 'linear-gradient(160deg, #0a1209 0%, #0f1a0d 50%, #0a1008 100%)',  glassBg: 'rgba(14, 22, 12, 0.72)' },
  { key: 'midnight',    label: '子夜蓝',  gradient: 'linear-gradient(160deg, #080a14 0%, #0d1020 50%, #08090f 100%)',  glassBg: 'rgba(12, 14, 28, 0.72)' },
  { key: 'ember',       label: '余烬',    gradient: 'linear-gradient(160deg, #1a0a08 0%, #2d1009 50%, #1c0c08 100%)',  glassBg: 'rgba(32, 14, 10, 0.72)' },
]

/** 根据 presetKey 返回对应的 glassBg 色值 */
export const getGlassBg = (presetKey?: string): string =>
  bgPresets.find(p => p.key === presetKey)?.glassBg ?? colors.glassBg

/* ── 保留：btnGlass / glass（仍有少量组件依赖） ── */
export const glass: CSSProperties = {
  background: colors.glassBg,
  backdropFilter: 'blur(12px) saturate(140%)',
  WebkitBackdropFilter: 'blur(12px) saturate(140%)',
  border: `1px solid ${colors.border}`,
  borderRadius: 14,
}

export const btnGlass: CSSProperties = {
  background: 'rgba(240, 235, 226, 0.08)',
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  color: colors.text,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  padding: '10px 24px',
  position: 'relative',
  zIndex: 2,
  transition: 'all 0.2s ease',
}
