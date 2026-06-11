import { create } from 'zustand'

interface HighContrastState {
  enabled: boolean
  toggle: () => void
}

const STORAGE_KEY = 'novel-engine-high-contrast'

function loadEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'true'
  } catch {
    return false
  }
}

function applyHighContrast(enabled: boolean) {
  if (enabled) {
    document.documentElement.classList.add('high-contrast')
  } else {
    document.documentElement.classList.remove('high-contrast')
  }
}

export const useHighContrastStore = create<HighContrastState>((set) => ({
  enabled: loadEnabled(),

  toggle: () => {
    set((state) => {
      const newEnabled = !state.enabled
      localStorage.setItem(STORAGE_KEY, String(newEnabled))
      applyHighContrast(newEnabled)
      return { enabled: newEnabled }
    })
  },
}))

// Apply on load
applyHighContrast(loadEnabled())
