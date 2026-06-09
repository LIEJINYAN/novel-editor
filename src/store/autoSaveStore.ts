import { create } from 'zustand'

type SaveStrategy = 'auto' | 'manual' | 'smart'

interface AutoSaveState {
  strategy: SaveStrategy
  interval: number
  isSaving: boolean
  lastSaved: number | null
  lastSavedContent: string | null
  hasChanges: boolean
  autoSaveEnabled: boolean
  setStrategy: (strategy: SaveStrategy) => void
  setInterval: (interval: number) => void
  setSaving: (saving: boolean) => void
  setLastSaved: (timestamp: number) => void
  setLastSavedContent: (content: string) => void
  setHasChanges: (hasChanges: boolean) => void
  toggleAutoSave: () => void
  shouldSave: (currentContent: string) => boolean
}

const STORAGE_KEY = 'novel-engine-autosave'

function loadSettings(): { strategy: SaveStrategy; interval: number; autoSaveEnabled: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {}
  return { strategy: 'smart', interval: 30000, autoSaveEnabled: true }
}

function saveSettings(settings: { strategy: SaveStrategy; interval: number; autoSaveEnabled: boolean }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

export const useAutoSaveStore = create<AutoSaveState>((set, get) => ({
  strategy: loadSettings().strategy,
  interval: loadSettings().interval,
  isSaving: false,
  lastSaved: null,
  lastSavedContent: null,
  hasChanges: false,
  autoSaveEnabled: loadSettings().autoSaveEnabled,

  setStrategy: (strategy) => {
    set({ strategy })
    saveSettings({ strategy, interval: get().interval, autoSaveEnabled: get().autoSaveEnabled })
  },

  setInterval: (interval) => {
    set({ interval })
    saveSettings({ strategy: get().strategy, interval, autoSaveEnabled: get().autoSaveEnabled })
  },

  setSaving: (saving) => set({ isSaving: saving }),

  setLastSaved: (timestamp) => set({ lastSaved: timestamp }),

  setLastSavedContent: (content) => set({ lastSavedContent: content }),

  setHasChanges: (hasChanges) => set({ hasChanges }),

  toggleAutoSave: () => {
    const newState = !get().autoSaveEnabled
    set({ autoSaveEnabled: newState })
    saveSettings({ strategy: get().strategy, interval: get().interval, autoSaveEnabled: newState })
  },

  shouldSave: (currentContent: string) => {
    const state = get()

    if (!state.autoSaveEnabled) return false
    if (state.strategy === 'manual') return false
    if (state.isSaving) return false
    if (currentContent === state.lastSavedContent) return false

    if (state.strategy === 'auto') {
      return true
    }

    if (state.strategy === 'smart') {
      if (!state.hasChanges) return false

      const timeSinceLastSave = state.lastSaved ? Date.now() - state.lastSaved : Infinity
      const hasSignificantChanges = state.lastSavedContent
        ? Math.abs(currentContent.length - state.lastSavedContent.length) > 50 ||
          currentContent.slice(0, 100) !== state.lastSavedContent.slice(0, 100)
        : true

      return timeSinceLastSave >= state.interval || hasSignificantChanges
    }

    return false
  },
}))
