import { useState, useCallback } from 'react'
import { ReadingTimeRecord } from '../utils/streak'

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

function getColor(minutes: number): string {
  if (minutes === 0) return 'rgba(255,255,255,0.05)'
  if (minutes <= 10) return '#fff3e0'
  if (minutes <= 30) return '#ffcc80'
  if (minutes <= 60) return '#ff9800'
  return '#bf360c'
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

export function StreakHeatmap({ records, current, longest }: StreakHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null)
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null)

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (DAYS - 1))

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
      background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
      borderRadius: 14,
      border: '1px solid rgba(168,85,247,0.12)',
      padding: '20px 16px 16px',
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,152,0,0.2)',
          border: '1px solid rgba(255,152,0,0.4)',
          borderRadius: 20, padding: '6px 14px',
        }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ color: '#ffcc80', fontSize: 13, fontWeight: 600 }}>
            当前连击: {current}天
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(191,54,12,0.2)',
          border: '1px solid rgba(191,54,12,0.4)',
          borderRadius: 20, padding: '6px 14px',
        }}>
          <span style={{ fontSize: 14 }}>🏆</span>
          <span style={{ color: '#ff8a65', fontSize: 13, fontWeight: 600 }}>
            最长连击: {longest}天
          </span>
        </div>
      </div>

      {showEmpty ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: 120, gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>📭</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>还没有阅读记录</span>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 8, height: totalHeight }}>
              {[1, 3, 5].map(r => (
                <div key={r} style={{ height: CELL, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{DAY_LABELS[r]}</span>
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
                    color: 'rgba(255,255,255,0.35)',
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
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 6,
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