import { useState, useEffect, useCallback, useRef } from 'react'

interface PomodoroState {
  isRunning: boolean
  isBreak: boolean
  timeLeft: number
  sessions: number
  totalFocusTime: number
}

interface PomodoroConfig {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
}

const DEFAULT_CONFIG: PomodoroConfig = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
}

const STORAGE_KEY = 'novel-engine-pomodoro'

export function usePomodoro(config: Partial<PomodoroConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  const [state, setState] = useState<PomodoroState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      isRunning: false,
      isBreak: false,
      timeLeft: fullConfig.focusDuration,
      sessions: 0,
      totalFocusTime: 0,
    }
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const getDuration = useCallback(() => {
    if (state.isBreak) {
      return (state.sessions + 1) % fullConfig.sessionsBeforeLongBreak === 0
        ? fullConfig.longBreakDuration
        : fullConfig.shortBreakDuration
    }
    return fullConfig.focusDuration
  }, [state.isBreak, state.sessions, fullConfig])

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.timeLeft <= 1) {
        const newSessions = prev.isBreak ? prev.sessions : prev.sessions + 1
        const newFocusTime = prev.isBreak ? prev.totalFocusTime : prev.totalFocusTime + fullConfig.focusDuration
        const nextIsBreak = !prev.isBreak

        return {
          isRunning: false,
          isBreak: nextIsBreak,
          timeLeft: nextIsBreak
            ? (newSessions % fullConfig.sessionsBeforeLongBreak === 0
                ? fullConfig.longBreakDuration
                : fullConfig.shortBreakDuration)
            : fullConfig.focusDuration,
          sessions: newSessions,
          totalFocusTime: newFocusTime,
        }
      }
      return { ...prev, timeLeft: prev.timeLeft - 1 }
    })
  }, [fullConfig])

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

  const start = useCallback(() => setState((prev) => ({ ...prev, isRunning: true })), [])
  const pause = useCallback(() => setState((prev) => ({ ...prev, isRunning: false })), [])
  const reset = useCallback(() => {
    setState({
      isRunning: false,
      isBreak: false,
      timeLeft: fullConfig.focusDuration,
      sessions: 0,
      totalFocusTime: 0,
    })
  }, [fullConfig.focusDuration])
  const skip = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      isBreak: !prev.isBreak,
      timeLeft: prev.isBreak ? fullConfig.focusDuration : fullConfig.shortBreakDuration,
    }))
  }, [fullConfig])

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
    progress: 1 - state.timeLeft / getDuration(),
  }
}
