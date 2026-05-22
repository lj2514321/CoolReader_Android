import { useState, useEffect, useMemo } from 'react'
import { loadReadingTimeRange, loadBookReadingTimeRange } from '../utils/db'
import type { BookRecord } from '../utils/db'

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
    { label: '今日', value: formatShort(readingTime), icon: '📖' },
    { label: '本周', value: formatShort(weekTotal), icon: '📊' },
    { label: '本月', value: formatShort(monthTotal), icon: '📅' },
    { label: '总计', value: formatShort(allTotal), icon: '⏱' },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 16px 32px' }}>
      <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 20px', letterSpacing: -0.3 }}>📊 阅读统计</p>

      {/* summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
            border: '1px solid rgba(168,85,247,0.12)',
            padding: '16px 14px',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* goal */}
      {readingGoal > 0 && (
        <div style={{
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
          border: '1px solid rgba(168,85,247,0.12)',
          padding: '16px 20px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>🎯 今日目标</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {Math.floor(readingTime / 60)}m / {readingGoal}m
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, Math.round(readingTime / readingGoal * 100))}%`,
              height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg, #6366f1, #a855f7)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* 14-day chart */}
      <div style={{
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
        border: '1px solid rgba(168,85,247,0.12)',
        padding: '20px 16px 12px',
      }}>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>近 14 天</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
          {chartData.map(d => (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: `${Math.max(2, (d.seconds / maxVal) * 60)}px`,
                background: 'linear-gradient(180deg, #6366f1, #a855f7)',
                opacity: 0.7 + (d.seconds / maxVal) * 0.3,
                transition: 'height 0.3s',
                minHeight: d.seconds > 0 ? 2 : 0,
              }} />
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', writingMode: 'vertical-lr', textOrientation: 'mixed' }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* per-book reading time */}
      {bookRecords.length > 0 && (
        <div style={{
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
          border: '1px solid rgba(168,85,247,0.12)',
          padding: '16px 16px 8px',
          marginTop: 16,
        }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>每本书阅读时间</div>
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
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < totals.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>📖</span>
                <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bt.title}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
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
