import { create } from 'zustand'

interface WordCountState {
  currentCount: number
  totalCount: number
  setCurrentCount: (count: number) => void
  addToTotal: (count: number) => void
}

const STORAGE_KEY = 'novel-engine-wordcount'

function loadCounts(): { currentCount: number; totalCount: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { currentCount: 0, totalCount: 0 }
}

function saveCounts(counts: { currentCount: number; totalCount: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts))
  } catch {}
}

export const useWordCountStore = create<WordCountState>((set, get) => ({
  currentCount: loadCounts().currentCount,
  totalCount: loadCounts().totalCount,

  setCurrentCount: (count) => {
    set({ currentCount: count })
    saveCounts({ currentCount: count, totalCount: get().totalCount })
  },

  addToTotal: (count) => {
    set((state) => {
      const newTotal = state.totalCount + count
      saveCounts({ currentCount: state.currentCount, totalCount: newTotal })
      return { totalCount: newTotal }
    })
  },
}))
