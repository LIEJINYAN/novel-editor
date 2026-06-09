import { create } from 'zustand'

interface DailyStats {
  date: string
  wordsWritten: number
  timeSpent: number
  sessionsCount: number
}

interface WritingStatsState {
  dailyStats: Record<string, DailyStats>
  currentSessionStart: number | null
  totalWordsWritten: number
  totalTimeSpent: number
  startSession: () => void
  endSession: () => void
  updateWordCount: (currentWordCount: number) => void
  getTodayStats: () => DailyStats
  getWeekStats: () => DailyStats[]
  getMonthStats: () => DailyStats[]
}

const STORAGE_KEY = 'novel-engine-writing-stats'

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function loadStats(): Record<string, DailyStats> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

function saveStats(stats: Record<string, DailyStats>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
}

export const useWritingStatsStore = create<WritingStatsState>((set, get) => ({
  dailyStats: loadStats(),
  currentSessionStart: null,
  totalWordsWritten: 0,
  totalTimeSpent: 0,

  startSession: () => {
    set({ currentSessionStart: Date.now() })
  },

  endSession: () => {
    const state = get()
    if (!state.currentSessionStart) return

    const sessionDuration = Math.floor((Date.now() - state.currentSessionStart) / 1000)
    const todayKey = getTodayKey()

    set((state) => {
      const todayStats = state.dailyStats[todayKey] || {
        date: todayKey,
        wordsWritten: 0,
        timeSpent: 0,
        sessionsCount: 0,
      }

      const updatedStats = {
        ...state.dailyStats,
        [todayKey]: {
          ...todayStats,
          timeSpent: todayStats.timeSpent + sessionDuration,
          sessionsCount: todayStats.sessionsCount + 1,
        },
      }

      saveStats(updatedStats)

      return {
        dailyStats: updatedStats,
        currentSessionStart: null,
        totalTimeSpent: state.totalTimeSpent + sessionDuration,
      }
    })
  },

  updateWordCount: (currentWordCount) => {
    const state = get()
    const todayKey = getTodayKey()

    set((prevState) => {
      const todayStats = prevState.dailyStats[todayKey] || {
        date: todayKey,
        wordsWritten: 0,
        timeSpent: 0,
        sessionsCount: 0,
      }

      const wordsDelta = currentWordCount - (prevState.totalWordsWritten || 0)

      const updatedStats = {
        ...prevState.dailyStats,
        [todayKey]: {
          ...todayStats,
          wordsWritten: todayStats.wordsWritten + Math.max(0, wordsDelta),
        },
      }

      saveStats(updatedStats)

      return {
        dailyStats: updatedStats,
        totalWordsWritten: currentWordCount,
      }
    })
  },

  getTodayStats: () => {
    const state = get()
    const todayKey = getTodayKey()
    return state.dailyStats[todayKey] || {
      date: todayKey,
      wordsWritten: 0,
      timeSpent: 0,
      sessionsCount: 0,
    }
  },

  getWeekStats: () => {
    const state = get()
    const stats: DailyStats[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      stats.push(
        state.dailyStats[key] || {
          date: key,
          wordsWritten: 0,
          timeSpent: 0,
          sessionsCount: 0,
        }
      )
    }

    return stats
  },

  getMonthStats: () => {
    const state = get()
    const stats: DailyStats[] = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      stats.push(
        state.dailyStats[key] || {
          date: key,
          wordsWritten: 0,
          timeSpent: 0,
          sessionsCount: 0,
        }
      )
    }

    return stats
  },
}))
