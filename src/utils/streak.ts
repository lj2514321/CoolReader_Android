export interface ReadingTimeRecord {
  date: string
  seconds: number
}

export interface StreakResult {
  current: number
  longest: number
}

export function calcStreak(records: ReadingTimeRecord[]): StreakResult {
  // Filter to days with reading time > 0
  const activeDays = records.filter(r => r.seconds > 0)

  if (activeDays.length === 0) {
    return { current: 0, longest: 0 }
  }

  // Sort by date ascending
  activeDays.sort((a, b) => a.date.localeCompare(b.date))

  const today = new Date().toISOString().split('T')[0]

  // Compute longest streak
  let longest = 0
  let currentLongest = 1

  for (let i = 1; i < activeDays.length; i++) {
    const prevDate = new Date(activeDays[i - 1].date)
    const currDate = new Date(activeDays[i].date)
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentLongest++
    } else {
      longest = Math.max(longest, currentLongest)
      currentLongest = 1
    }
  }
  longest = Math.max(longest, currentLongest)

  // Compute current streak (consecutive days from today going backwards)
  let current = 0
  const todayRecord = activeDays.find(r => r.date === today)

  if (todayRecord && todayRecord.seconds > 0) {
    current = 1
    let checkDate = new Date(today)

    while (true) {
      checkDate.setDate(checkDate.getDate() - 1)
      const checkDateStr = checkDate.toISOString().split('T')[0]
      const found = activeDays.find(r => r.date === checkDateStr && r.seconds > 0)

      if (found) {
        current++
      } else {
        break
      }
    }
  }

  return { current, longest }
}