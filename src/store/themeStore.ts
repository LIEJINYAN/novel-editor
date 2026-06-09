import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  wordWrap: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleWordWrap: () => void
}

const THEME_STORAGE_KEY = 'novel-engine-theme'
const WORD_WRAP_STORAGE_KEY = 'novel-engine-word-wrap'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'dark'
}

function getInitialWordWrap(): boolean {
  try {
    const stored = localStorage.getItem(WORD_WRAP_STORAGE_KEY)
    if (stored !== null) return stored === 'true'
  } catch {}
  return true
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  wordWrap: getInitialWordWrap(),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      return { theme: newTheme }
    }),
  setTheme: (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  toggleWordWrap: () =>
    set((state) => {
      const newWordWrap = !state.wordWrap
      localStorage.setItem(WORD_WRAP_STORAGE_KEY, String(newWordWrap))
      return { wordWrap: newWordWrap }
    }),
}))
