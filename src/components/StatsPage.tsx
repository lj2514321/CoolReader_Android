import { useState, useEffect, useMemo } from 'react'
import { loadReadingTimeRange, loadBookReadingTimeRange } from '../utils/db'
import type { BookRecord } from '../utils/db'
import { calcStreak } from '../utils/streak'
import { StreakHeatmap } from './StreakHeatmap'
import type { ReadingTimeRecord } from '../utils/streak'
import { colors } from '../utils/styles'

/* Direction A+C design tokens */
const fontDisplay = "'Georgia', 'Noto Serif SC', 'Times New Roman', serif"
const fontBody = "system-ui, -apple-system, 'Segoe UI', sans-serif"

const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)
const IconBar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.seal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const BOOK_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

interface StatsPageProps {
  books: BookRecord[]
  readingTime: number
  readingGoal: number
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatShort(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m}m`
  return `${m}m`
}

export function StatsPage({ books, readingTime, readingGoal }: StatsPageProps) {
  const [records, setRecords] = useState<{ date: string; seconds: number }[]>([])
  const [bookRecords, setBookRecords] = useState<{ filePath: string; date: string; seconds: number }[]>([])
  const [streakData, setStreakData] = useState<{ records: ReadingTimeRecord[], current: number, longest: number }>({ records: [], current: 0, longest: 0 })

  useEffect(() => {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 90)
    const dateFrom = from.toISOString().slice(0, 10)
    const dateTo = to.toISOString().slice(0, 10)
    Promise.all([
      loadReadingTimeRange(dateFrom, dateTo),
      loadBookReadingTimeRange(dateFrom, dateTo),
    ]).then(([daily, perBook]) => {
      setRecords(daily)
      setBookRecords(perBook)
      const streak = calcStreak(daily as ReadingTimeRecord[])
      setStreakData({ records: daily as ReadingTimeRecord[], current: streak.current, longest: streak.longest })
    }).catch(() => {})
  }, [])

  const { weekTotal, monthTotal, allTotal, chartData, maxVal } = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let week = 0, month = 0, all = 0
    const days: { label: string; seconds: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const sec = records.find(r => r.date === key)?.seconds ?? 0
      days.push({
        label: key.slice(5),
        seconds: sec,
      })
      if (key <= today) all += sec
      if (key >= monthStart.toISOString().slice(0, 10)) month += sec
      if (key >= weekStart.toISOString().slice(0, 10)) week += sec
    }

    const max = Math.max(...days.map(d => d.seconds), 1)
    return { weekTotal: week, monthTotal: month, allTotal: all, chartData: days, maxVal: max }
  }, [records])

  const cards = [
    { label: '今日', value: formatShort(readingTime), Icon: IconBook },
    { label: '本周', value: formatShort(weekTotal), Icon: IconBar },
    { label: '本月', value: formatShort(monthTotal), Icon: IconCalendar },
    { label: '总计', value: formatShort(allTotal), Icon: IconClock },
  ]

  const goalPct = readingGoal > 0 ? Math.min(100, Math.round(readingTime / 60 / readingGoal * 100)) : 0

  return (
    <div className="cr-lamp-light" style={{ height: '100%', overflowY: 'auto', padding: '32px 24px 40px' }}>
      {/* Header — 衬线大标题 */}
      <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{
          color: colors.amber,
          fontFamily: fontDisplay,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.30em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          STATISTICS
        </div>
        <h1 style={{
          color: colors.text,
          fontFamily: fontDisplay,
          fontSize: 32,
          fontWeight: 700,
          margin: 0,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          灯 · 心迹
        </h1>
      </div>

      {/* summary cards — 大衬线数字 + 印章红下划线 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 32, border: `1px solid ${colors.border}` }}>
        {cards.map((c, i) => (
          <div key={c.label} style={{
            borderRight: (i % 2 === 0) ? `1px solid ${colors.border}` : 'none',
            borderBottom: (i < 2) ? `1px solid ${colors.border}` : 'none',
            padding: '20px 16px',
            background: 'rgba(19, 16, 12, 0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ marginBottom: 10, opacity: 0.85 }}><c.Icon /></div>
            <div style={{
              fontFamily: fontDisplay,
              fontSize: 30,
              fontWeight: 700,
              color: colors.amber,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              marginBottom: 6,
            }}>{c.value}</div>
            <div style={{
              fontFamily: fontDisplay,
              fontSize: 12,
              color: colors.textMuted,
              letterSpacing: '0.10em',
            }}>{c.label}</div>
            {/* 印章红小角 */}
            <div style={{
              position: 'absolute', top: 8, right: 8,
              width: 5, height: 5, background: colors.seal, opacity: 0.6,
            }} />
          </div>
        ))}
      </div>

      {/* goal — 火焰进度条 */}
      {readingGoal > 0 && (
        <div style={{
          background: 'rgba(19, 16, 12, 0.4)',
          border: `1px solid ${colors.border}`,
          borderRadius: 2,
          padding: '18px 20px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ color: colors.text, fontFamily: fontDisplay, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTarget />今日目标
            </span>
            <span style={{
              color: colors.amber,
              fontFamily: fontDisplay,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}>
              {Math.floor(readingTime / 60)}<span style={{ color: colors.textMuted, fontSize: 12 }}>m</span> / {readingGoal}<span style={{ color: colors.textMuted, fontSize: 12 }}>m</span>
            </span>
          </div>
          <div className="cr-flame-progress">
            <div className="flame" style={{
              width: `${goalPct}%`,
            }} />
          </div>
        </div>
      )}

      {/* 14-day chart — 衬线标题 */}
      <div style={{
        background: 'rgba(19, 16, 12, 0.4)',
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        padding: '20px 18px 14px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{
            color: colors.text,
            fontFamily: fontDisplay,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>近 14 天</span>
          <span style={{
            color: colors.textFaint,
            fontFamily: fontDisplay,
            fontSize: 11,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}>Last fortnight</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 90 }}>
          {chartData.map(d => (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%',
                height: `${Math.max(2, (d.seconds / maxVal) * 64)}px`,
                background: d.seconds > 0
                  ? `linear-gradient(180deg, ${colors.flame} 0%, ${colors.amber} 100%)`
                  : 'rgba(240,235,226,0.06)',
                opacity: d.seconds > 0 ? (0.55 + (d.seconds / maxVal) * 0.45) : 1,
                transition: 'height 0.4s',
                minHeight: d.seconds > 0 ? 2 : 2,
                boxShadow: d.seconds > maxVal * 0.7 ? `0 0 6px ${colors.amberGlow}` : 'none',
              }} />
              <span style={{
                fontSize: 8,
                color: colors.textFaint,
                writingMode: 'vertical-lr',
                textOrientation: 'mixed',
                fontFamily: fontBody,
              }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak Heatmap */}
      <div style={{ marginBottom: 24 }}>
        <StreakHeatmap records={streakData.records} current={streakData.current} longest={streakData.longest} />
      </div>

      {/* per-book reading time */}
      {bookRecords.length > 0 && (
        <div style={{
          background: 'rgba(19, 16, 12, 0.4)',
          border: `1px solid ${colors.border}`,
          borderRadius: 2,
          padding: '20px 18px 12px',
        }}>
          <div style={{
            color: colors.text,
            fontFamily: fontDisplay,
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 14,
            letterSpacing: '-0.01em',
          }}>每本书阅读时间</div>
          {(() => {
            const totals: { title: string; seconds: number }[] = []
            const map = new Map<string, number>()
            for (const r of bookRecords) {
              map.set(r.filePath, (map.get(r.filePath) || 0) + r.seconds)
            }
            const getTitle = (fp: string) => {
              const b = books.find(b => b.filePath === fp)
              return b?.title || fp.split('\\').pop()?.split('/').pop() || fp
            }
            map.forEach((secs, fp) => totals.push({ title: getTitle(fp), seconds: secs }))
            totals.sort((a, b) => b.seconds - a.seconds)
            return totals.map((bt, i) => (
              <div key={bt.title} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < totals.length - 1 ? `1px solid ${colors.border}` : undefined,
              }}>
                <span style={{ flexShrink: 0 }}>{BOOK_ICON}</span>
                <span style={{
                  flex: 1,
                  fontSize: 13,
                  color: colors.text,
                  fontFamily: fontBody,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {bt.title}
                </span>
                <span style={{
                  fontFamily: fontDisplay,
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.amber,
                  flexShrink: 0,
                  letterSpacing: '-0.01em',
                }}>
                  {formatShort(bt.seconds)}
                </span>
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
