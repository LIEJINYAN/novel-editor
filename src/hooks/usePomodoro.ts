import { useState, useEffect, useCallback, useRef } from 'react'

interface PomodoroState {
  isRunning: boolean
  isBreak: boolean
  timeLeft: number
  sessions: number
  totalFocusTime: number
  dailyStats: DailyStats[]
}

interface DailyStats {
  date: string
  completedSessions: number
  totalFocusMinutes: number
  totalBreakMinutes: number
}

interface PomodoroConfig {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  autoStartFocus: boolean
  soundEnabled: boolean
}

const DEFAULT_CONFIG: PomodoroConfig = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
  autoStartBreak: true,
  autoStartFocus: false,
  soundEnabled: true,
}

const STORAGE_KEY = 'novel-engine-pomodoro'
const STATS_KEY = 'novel-engine-pomodoro-stats'
const CONFIG_KEY = 'novel-engine-pomodoro-config'

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function loadStats(): DailyStats[] {
  try {
    const stored = localStorage.getItem(STATS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function saveStats(stats: DailyStats[]): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats.slice(-30)))
  } catch {}
}

function loadConfig(): Partial<PomodoroConfig> {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

function saveConfig(config: Partial<PomodoroConfig>): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch {}
}

function updateDailyStats(stats: DailyStats[], isBreak: boolean, duration: number): DailyStats[] {
  const today = getToday()
  const existing = stats.find((s) => s.date === today)

  if (existing) {
    if (isBreak) {
      existing.totalBreakMinutes += Math.floor(duration / 60)
    } else {
      existing.completedSessions += 1
      existing.totalFocusMinutes += Math.floor(duration / 60)
    }
    return [...stats]
  }

  const newStat: DailyStats = {
    date: today,
    completedSessions: isBreak ? 0 : 1,
    totalFocusMinutes: isBreak ? 0 : Math.floor(duration / 60),
    totalBreakMinutes: isBreak ? Math.floor(duration / 60) : 0,
  }
  return [...stats, newStat]
}

export function usePomodoro(overrides: Partial<PomodoroConfig> = {}) {
  const savedConfig = loadConfig()
  const fullConfig = { ...DEFAULT_CONFIG, ...savedConfig, ...overrides }

  const [state, setState] = useState<PomodoroState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...parsed, dailyStats: loadStats() }
      }
    } catch {}
    return {
      isRunning: false,
      isBreak: false,
      timeLeft: fullConfig.focusDuration,
      sessions: 0,
      totalFocusTime: 0,
      dailyStats: loadStats(),
    }
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notificationRef = useRef<Notification | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isRunning: false,
      isBreak: state.isBreak,
      timeLeft: state.timeLeft,
      sessions: state.sessions,
      totalFocusTime: state.totalFocusTime,
    }))
  }, [state.isBreak, state.timeLeft, state.sessions, state.totalFocusTime])

  useEffect(() => {
    saveStats(state.dailyStats)
  }, [state.dailyStats])

  const getDuration = useCallback(() => {
    if (state.isBreak) {
      return (state.sessions + 1) % fullConfig.sessionsBeforeLongBreak === 0
        ? fullConfig.longBreakDuration
        : fullConfig.shortBreakDuration
    }
    return fullConfig.focusDuration
  }, [state.isBreak, state.sessions, fullConfig])

  const showNotification = useCallback((title: string, body: string) => {
    if (!fullConfig.soundEnabled) return

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification(title, {
            body,
            icon: '🍅',
            tag: 'pomodoro',
          })
          notificationRef.current = notification
          setTimeout(() => notification.close(), 5000)
        } catch {}
      }
    }

    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+JkI+Gd2Bse4aSkY2DeGdwhI+Ri4N7aHKEkJGLg3todIWQkYuDfGt1hZCRi4N8a3aFkJGLg31sdoWQkYuDfWx3hZCRi4N9bXiGkJGLg35teIaQkYuDf254hpCRi4N/bnmGkJGLg4BveoaQkYu')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {}
  }, [fullConfig.soundEnabled])

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.timeLeft <= 1) {
        const newSessions = prev.isBreak ? prev.sessions : prev.sessions + 1
        const duration = getDuration()
        const newStats = updateDailyStats(prev.dailyStats, prev.isBreak, duration)
        const nextIsBreak = !prev.isBreak

        const title = prev.isBreak ? '休息结束' : '专注完成'
        const body = prev.isBreak ? '开始新的专注' : `已完成 ${newSessions} 个番茄`

        showNotification(title, body)

        const nextDuration = nextIsBreak
          ? (newSessions % fullConfig.sessionsBeforeLongBreak === 0
              ? fullConfig.longBreakDuration
              : fullConfig.shortBreakDuration)
          : fullConfig.focusDuration

        return {
          isRunning: nextIsBreak ? fullConfig.autoStartBreak : fullConfig.autoStartFocus,
          isBreak: nextIsBreak,
          timeLeft: nextDuration,
          sessions: newSessions,
          totalFocusTime: prev.isBreak ? prev.totalFocusTime : prev.totalFocusTime + duration,
          dailyStats: newStats,
        }
      }
      return { ...prev, timeLeft: prev.timeLeft - 1 }
    })
  }, [fullConfig, getDuration, showNotification])

  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(tick, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isRunning, tick])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const start = useCallback(() => setState((prev) => ({ ...prev, isRunning: true })), [])
  const pause = useCallback(() => setState((prev) => ({ ...prev, isRunning: false })), [])
  const reset = useCallback(() => {
    setState((prev) => ({
      isRunning: false,
      isBreak: false,
      timeLeft: fullConfig.focusDuration,
      sessions: 0,
      totalFocusTime: 0,
      dailyStats: prev.dailyStats,
    }))
  }, [fullConfig.focusDuration])
  const skip = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      isBreak: !prev.isBreak,
      timeLeft: prev.isBreak ? fullConfig.focusDuration : fullConfig.shortBreakDuration,
    }))
  }, [fullConfig])

  const updateConfig = useCallback((newConfig: Partial<PomodoroConfig>) => {
    saveConfig(newConfig)
  }, [])

  const getWeeklyStats = useCallback(() => {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    return state.dailyStats.filter((s) => {
      const date = new Date(s.date)
      return date >= weekAgo
    })
  }, [state.dailyStats])

  const getTodayStats = useCallback((): DailyStats | null => {
    const today = getToday()
    return state.dailyStats.find((s) => s.date === today) || null
  }, [state.dailyStats])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    ...state,
    config: fullConfig,
    start,
    pause,
    reset,
    skip,
    formatTime,
    updateConfig,
    getWeeklyStats,
    getTodayStats,
    progress: 1 - state.timeLeft / getDuration(),
  }
}
