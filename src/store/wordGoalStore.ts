import { create } from 'zustand'

interface WordGoal {
  daily: number
  chapter: number
  novel: number
}

interface WordGoalProgress {
  daily: number
  chapter: number
  novel: number
  lastResetDate: string
}

interface WordGoalState {
  goals: WordGoal
  progress: WordGoalProgress
  setDailyGoal: (goal: number) => void
  setChapterGoal: (goal: number) => void
  setNovelGoal: (goal: number) => void
  addWordCount: (count: number) => void
  resetDailyProgress: () => void
  resetChapterProgress: () => void
  resetNovelProgress: () => void
  getDailyPercent: () => number
  getChapterPercent: () => number
  getNovelPercent: () => number
}

const GOALS_KEY = 'novel-engine-word-goals'
const PROGRESS_KEY = 'novel-engine-word-progress'

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function loadGoals(): WordGoal {
  try {
    const stored = localStorage.getItem(GOALS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {}
  return { daily: 1000, chapter: 5000, novel: 50000 }
}

function loadProgress(): WordGoalProgress {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY)
    if (stored) {
      const progress = JSON.parse(stored)
      if (progress.lastResetDate !== getTodayString()) {
        return { ...progress, daily: 0, lastResetDate: getTodayString() }
      }
      return progress
    }
  } catch {}
  return { daily: 0, chapter: 0, novel: 0, lastResetDate: getTodayString() }
}

export const useWordGoalStore = create<WordGoalState>((set, get) => ({
  goals: loadGoals(),
  progress: loadProgress(),

  setDailyGoal: (goal) => {
    set((state) => {
      const newGoals = { ...state.goals, daily: goal }
      localStorage.setItem(GOALS_KEY, JSON.stringify(newGoals))
      return { goals: newGoals }
    })
  },

  setChapterGoal: (goal) => {
    set((state) => {
      const newGoals = { ...state.goals, chapter: goal }
      localStorage.setItem(GOALS_KEY, JSON.stringify(newGoals))
      return { goals: newGoals }
    })
  },

  setNovelGoal: (goal) => {
    set((state) => {
      const newGoals = { ...state.goals, novel: goal }
      localStorage.setItem(GOALS_KEY, JSON.stringify(newGoals))
      return { goals: newGoals }
    })
  },

  addWordCount: (count) => {
    set((state) => {
      const today = getTodayString()
      let newProgress = { ...state.progress }

      if (newProgress.lastResetDate !== today) {
        newProgress.daily = 0
        newProgress.lastResetDate = today
      }

      newProgress.daily += count
      newProgress.chapter += count
      newProgress.novel += count

      localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress))
      return { progress: newProgress }
    })
  },

  resetDailyProgress: () => {
    set((state) => {
      const newProgress = { ...state.progress, daily: 0, lastResetDate: getTodayString() }
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress))
      return { progress: newProgress }
    })
  },

  resetChapterProgress: () => {
    set((state) => {
      const newProgress = { ...state.progress, chapter: 0 }
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress))
      return { progress: newProgress }
    })
  },

  resetNovelProgress: () => {
    set((state) => {
      const newProgress = { ...state.progress, novel: 0 }
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress))
      return { progress: newProgress }
    })
  },

  getDailyPercent: () => {
    const state = get()
    if (state.goals.daily === 0) return 0
    return Math.min(100, Math.round((state.progress.daily / state.goals.daily) * 100))
  },

  getChapterPercent: () => {
    const state = get()
    if (state.goals.chapter === 0) return 0
    return Math.min(100, Math.round((state.progress.chapter / state.goals.chapter) * 100))
  },

  getNovelPercent: () => {
    const state = get()
    if (state.goals.novel === 0) return 0
    return Math.min(100, Math.round((state.progress.novel / state.goals.novel) * 100))
  },
}))
