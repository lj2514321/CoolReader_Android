import { useState, useCallback } from 'react'
import { ReadingTimeRecord } from '../utils/streak'
import { colors } from '../utils/styles'

interface StreakHeatmapProps {
  records: ReadingTimeRecord[]
  current: number
  longest: number
}

const DAYS = 90
const CELL = 16
const GAP = 2
const COLS = 13
const ROWS = 7
const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

/* Heatmap gradient anchored on amber (Direction A) instead of pure orange.
   The intensity rises with reading minutes; hue stays in the warm range. */
function getColor(minutes: number): string {
  if (minutes === 0) return 'rgba(240,235,226,0.06)'
  if (minutes <= 10) return 'rgba(212,146,58,0.25)'
  if (minutes <= 30) return 'rgba(212,146,58,0.55)'
  if (minutes <= 60) return 'rgba(212,146,58,0.85)'
  return '#d4923a'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

interface CellData {
  date: string
  minutes: number
  col: number
  row: number
}

const FlameIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
)

const TrophyIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
)

export function StreakHeatmap({ records, current, longest }: StreakHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null)
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null)

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (DAYS - 1))

  const cells: CellData[] = []
  const recordMap = new Map(records.map(r => [r.date, Math.round(r.seconds / 60)]))

  for (let i = 0; i < DAYS; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayOfWeek = d.getDay()
    const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const col = Math.floor(i / 7)
    cells.push({ date: dateStr, minutes: recordMap.get(dateStr) ?? 0, col, row })
  }

  const monthLabels: { month: string; col: number }[] = []
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    if (d.getDate() === 1) {
      const col = Math.floor(i / 7)
      monthLabels.push({ month: `${d.getMonth() + 1}月`, col })
    }
  }

  const showEmpty = records.length === 0
  const totalWidth = COLS * (CELL + GAP) + GAP
  const totalHeight = ROWS * (CELL + GAP) + GAP
  const LABEL_WIDTH = 32

  const handleClick = useCallback((cell: CellData) => {
    setSelectedCell(prev => prev?.date === cell.date ? null : cell)
  }, [])

  const tooltipCell = selectedCell ?? hoveredCell

  return (
    <div style={{
      background: 'rgba(19, 16, 12, 0.4)',
      borderRadius: 2,
      border: `1px solid ${colors.border}`,
      padding: '20px 18px 18px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: colors.amberDim,
          border: `1px solid ${colors.borderAmber}`,
          borderRadius: 999, padding: '6px 14px',
        }}>
          <FlameIcon />
          <span style={{
            color: colors.amber,
            fontFamily: "'Georgia', 'Noto Serif SC', serif",
            fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
          }}>
            连击 {current} 天
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(240,235,226,0.04)',
          border: `1px solid ${colors.border}`,
          borderRadius: 999, padding: '6px 14px',
        }}>
          <TrophyIcon />
          <span style={{
            color: colors.textMuted,
            fontFamily: "'Georgia', 'Noto Serif SC', serif",
            fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
          }}>
            最长 {longest} 天
          </span>
        </div>
      </div>

      {showEmpty ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: 120, gap: 8,
        }}>
          <FlameIcon size={28} />
          <span style={{ color: colors.textMuted, fontSize: 13 }}>还没有阅读记录</span>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 8, height: totalHeight }}>
              {[1, 3, 5].map(r => (
                <div key={r} style={{ height: CELL, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: colors.textFaint }}>{DAY_LABELS[r]}</span>
                </div>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', height: 16, marginBottom: 2, position: 'relative' }}>
                {monthLabels.map((ml, idx) => (
                  <div key={idx} style={{
                    position: 'absolute',
                    left: (ml.col * (CELL + GAP) + GAP),
                    fontSize: 10,
                    color: colors.textFaint,
                  }}>
                    {ml.month}
                  </div>
                ))}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
                gap: GAP,
                width: totalWidth,
              }}>
                {Array.from({ length: COLS * ROWS }).map((_, idx) => {
                  const col = Math.floor(idx / ROWS)
                  const row = idx % ROWS
                  const cell = cells.find(c => c.col === col && c.row === row)
                  if (!cell) return <div key={idx} />

                  return (
                    <div
                      key={idx}
                      onClick={() => handleClick(cell)}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 2,
                        background: getColor(cell.minutes),
                        cursor: 'pointer',
                        boxShadow: cell.minutes > 60 ? `0 0 4px ${colors.amberGlow}` : 'none',
                        transition: 'transform 0.1s',
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {tooltipCell && (
            <div style={{
              position: 'absolute',
              left: (LABEL_WIDTH + tooltipCell.col * (CELL + GAP) + GAP),
              top: (18 + tooltipCell.row * (CELL + GAP) + GAP),
              background: 'var(--cr-glass-bg, rgba(28, 23, 16, 0.92))',
              backdropFilter: 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: 'blur(20px) saturate(140%)',
              color: colors.text,
              fontFamily: "'Georgia', 'Noto Serif SC', serif",
              fontSize: 12,
              padding: '5px 10px',
              borderRadius: 2,
              border: `1px solid ${colors.borderAmber}`,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}>
              {formatDate(tooltipCell.date)} · {tooltipCell.minutes}分钟
            </div>
          )}
        </div>
      )}
    </div>
  )
}
