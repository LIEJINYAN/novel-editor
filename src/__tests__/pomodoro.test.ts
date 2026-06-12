import { describe, it, expect, beforeEach } from 'vitest'

const STORAGE_KEY = 'novel-engine-pomodoro'
const STATS_KEY = 'novel-engine-pomodoro-stats'
const CONFIG_KEY = 'novel-engine-pomodoro-config'

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function loadStats(): any[] {
  try {
    const stored = localStorage.getItem(STATS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function saveStats(stats: any[]): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats.slice(-30)))
  } catch {}
}

function loadConfig(): any {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

function saveConfig(config: any): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch {}
}

function updateDailyStats(stats: any[], isBreak: boolean, duration: number): any[] {
  const today = getToday()
  const existing = stats.find((s: any) => s.date === today)

  if (existing) {
    if (isBreak) {
      existing.totalBreakMinutes += Math.floor(duration / 60)
    } else {
      existing.completedSessions += 1
      existing.totalFocusMinutes += Math.floor(duration / 60)
    }
    return [...stats]
  }

  const newStat = {
    date: today,
    completedSessions: isBreak ? 0 : 1,
    totalFocusMinutes: isBreak ? 0 : Math.floor(duration / 60),
    totalBreakMinutes: isBreak ? Math.floor(duration / 60) : 0,
  }
  return [...stats, newStat]
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

describe('Pomodoro utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('formatTime', () => {
    it('should format 0 seconds', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('should format seconds only', () => {
      expect(formatTime(45)).toBe('00:45')
    })

    it('should format minutes only', () => {
      expect(formatTime(60)).toBe('01:00')
    })

    it('should format minutes and seconds', () => {
      expect(formatTime(150)).toBe('02:30')
    })

    it('should format large values', () => {
      expect(formatTime(1500)).toBe('25:00')
    })
  })

  describe('loadStats / saveStats', () => {
    it('should return empty array initially', () => {
      expect(loadStats()).toEqual([])
    })

    it('should save and load stats', () => {
      const stats = [{ date: '2026-01-01', completedSessions: 5, totalFocusMinutes: 125, totalBreakMinutes: 25 }]
      saveStats(stats)
      expect(loadStats()).toEqual(stats)
    })

    it('should limit to 30 entries', () => {
      const stats = Array.from({ length: 50 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        completedSessions: i,
        totalFocusMinutes: i * 25,
        totalBreakMinutes: i * 5,
      }))
      saveStats(stats)
      expect(loadStats().length).toBe(30)
    })
  })

  describe('loadConfig / saveConfig', () => {
    it('should return empty object initially', () => {
      expect(loadConfig()).toEqual({})
    })

    it('should save and load config', () => {
      const config = { focusDuration: 30 * 60, shortBreakDuration: 10 * 60 }
      saveConfig(config)
      expect(loadConfig()).toEqual(config)
    })
  })

  describe('updateDailyStats', () => {
    it('should add new daily stat for focus', () => {
      const result = updateDailyStats([], false, 1500)
      expect(result.length).toBe(1)
      expect(result[0].completedSessions).toBe(1)
      expect(result[0].totalFocusMinutes).toBe(25)
    })

    it('should add new daily stat for break', () => {
      const result = updateDailyStats([], true, 300)
      expect(result.length).toBe(1)
      expect(result[0].completedSessions).toBe(0)
      expect(result[0].totalBreakMinutes).toBe(5)
    })

    it('should update existing daily stat', () => {
      const today = getToday()
      const existing = [{ date: today, completedSessions: 2, totalFocusMinutes: 50, totalBreakMinutes: 10 }]
      const result = updateDailyStats(existing, false, 1500)
      expect(result[0].completedSessions).toBe(3)
      expect(result[0].totalFocusMinutes).toBe(75)
    })

    it('should update existing break stat', () => {
      const today = getToday()
      const existing = [{ date: today, completedSessions: 2, totalFocusMinutes: 50, totalBreakMinutes: 10 }]
      const result = updateDailyStats(existing, true, 600)
      expect(result[0].totalBreakMinutes).toBe(20)
    })
  })

  describe('localStorage persistence', () => {
    it('should save and load pomodoro state', () => {
      const state = {
        isRunning: false,
        isBreak: false,
        timeLeft: 1500,
        sessions: 3,
        totalFocusTime: 4500,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(loaded.sessions).toBe(3)
      expect(loaded.timeLeft).toBe(1500)
    })
  })
})
