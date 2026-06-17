import { describe, it, expect } from 'vitest'
import { calcStreak } from '../utils/streak'

describe('streak.ts - Reading streak calculation', () => {
  it('empty records returns zero streak', () => {
    const result = calcStreak([])
    expect(result).toEqual({ current: 0, longest: 0 })
  })

  // Helper: format a Date as YYYY-MM-DD
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  // Helper: get a Date offset from today by `offset` days
  const dayOffset = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d
  }

  it('single day (today) returns current=1, longest=1', () => {
    const result = calcStreak([{ date: fmt(dayOffset(0)), seconds: 300 }])
    expect(result).toEqual({ current: 1, longest: 1 })
  })

  it('7 consecutive days ending today returns current=7, longest=7', () => {
    const records = Array.from({ length: 7 }, (_, i) => ({
      date: fmt(dayOffset(-i)),
      seconds: 300,
    }))
    const result = calcStreak(records)
    expect(result.current).toBe(7)
    expect(result.longest).toBe(7)
  })

  it('gap in middle splits streak correctly', () => {
    // day1, gap (missing day2), day3
    const records = [
      { date: '2026-05-22', seconds: 300 },
      { date: '2026-05-24', seconds: 300 }, // gap of 1 day between 22 and 24
    ]

    const result = calcStreak(records)
    expect(result.longest).toBe(1) // two separate 1-day streaks
  })

  it('multiple streaks - longest correctly computed', () => {
    // Streak of 3, gap, streak of 4
    const records = [
      { date: '2026-05-20', seconds: 300 },
      { date: '2026-05-21', seconds: 300 },
      { date: '2026-05-22', seconds: 300 },
      { date: '2026-05-25', seconds: 300 },
      { date: '2026-05-26', seconds: 300 },
      { date: '2026-05-27', seconds: 300 },
      { date: '2026-05-28', seconds: 300 },
    ]

    const result = calcStreak(records)
    expect(result.longest).toBe(4) // longest streak is 4 days
  })

  it('days with zero seconds are ignored', () => {
    const records = [
      { date: '2026-05-24', seconds: 0 },
      { date: '2026-05-23', seconds: 300 },
    ]

    const result = calcStreak(records)
    // Only day with seconds > 0 counts
    expect(result.longest).toBe(1)
    expect(result.current).toBe(0) // today has 0 seconds
  })
})