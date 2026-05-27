import { useState, useRef, useCallback } from 'react'
import { ReadingTimeRecord } from '../utils/streak'

interface StreakHeatmapProps {
  records: ReadingTimeRecord[]
  current: number
  longest: number
}

const CELL = 12
const GAP = 3
const COLS = 53
const ROWS = 7
const DAYS = ['一', '二', '三', '四', '五', '六', '日']

function getColor(minutes: number): string {
  if (minutes === 0) return '#ebedf0'
  if (minutes <= 30) return '#9be9a8'
  if (minutes <= 60) return '#40c463'
  return '#30a14e'
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
  const [tooltip, setTooltip] = useState<{ date: string; minutes: number; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Build 365-day grid starting from Jan 1 of current year, or 365 days ago
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 364)

  const cells: CellData[] = []
  const recordMap = new Map(records.map(r => [r.date, Math.round(r.seconds / 60)]))

  for (let i = 0; i < 365; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayOfWeek = d.getDay() // 0=Sun, 1=Mon...
    // Convert to Mon=0 grid row
    const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const col = Math.floor(i / 7)
    cells.push({ date: dateStr, minutes: recordMap.get(dateStr) ?? 0, col, row })
  }

  const showEmpty = records.length === 0

  const handleMouseEnter = useCallback((cell: CellData, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({
      date: cell.date,
      minutes: cell.minutes,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  const totalWidth = COLS * (CELL + GAP) + GAP
  const totalHeight = ROWS * (CELL + GAP) + GAP

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
      borderRadius: 14,
      border: '1px solid rgba(168,85,247,0.12)',
      padding: '20px 16px 16px',
    }}>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(48,161,78,0.18)',
          border: '1px solid rgba(48,161,78,0.3)',
          borderRadius: 20, padding: '6px 14px',
        }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ color: '#9be9a8', fontSize: 13, fontWeight: 600 }}>
            当前连击: {current}天
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(99,102,241,0.18)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20, padding: '6px 14px',
        }}>
          <span style={{ fontSize: 14 }}>🏆</span>
          <span style={{ color: '#a855f7', fontSize: 13, fontWeight: 600 }}>
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
        <div ref={containerRef} style={{ position: 'relative', overflowX: 'auto', width: '100%' }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 8, float: 'left', height: totalHeight }}>
            {[1, 3, 5].map(r => (
              <div key={r} style={{ height: CELL, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{DAYS[r]}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
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
                  onMouseEnter={(e) => handleMouseEnter(cell, e)}
                  onMouseLeave={handleMouseLeave}
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

          {/* Tooltip */}
          {tooltip && (
            <div style={{
              position: 'absolute',
              left: tooltip.x + 12,
              top: tooltip.y - 28,
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 6,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}>
              {formatDate(tooltip.date)} · {tooltip.minutes}分钟
            </div>
          )}
        </div>
      )}
    </div>
  )
}