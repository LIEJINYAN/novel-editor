import { create } from 'zustand'

interface ThemeColors {
  background: string
  surface: string
  sidebar: string
  border: string
  text: string
  muted: string
  accent: string
  editorBg: string
}

interface CustomThemeState {
  customColors: ThemeColors | null
  setCustomColors: (colors: ThemeColors) => void
  resetCustomColors: () => void
  getColors: () => ThemeColors
}

const STORAGE_KEY = 'novel-engine-custom-theme'

const DEFAULT_COLORS: ThemeColors = {
  background: '#ffffff',
  surface: '#f5f5f5',
  sidebar: '#f0f0f0',
  border: '#e0e0e0',
  text: '#1a1a1a',
  muted: '#666666',
  accent: '#3b82f6',
  editorBg: '#ffffff',
}

const DARK_COLORS: ThemeColors = {
  background: '#1a1a1a',
  surface: '#2a2a2a',
  sidebar: '#252525',
  border: '#333333',
  text: '#e0e0e0',
  muted: '#888888',
  accent: '#60a5fa',
  editorBg: '#1e1e1e',
}

function loadCustomColors(): ThemeColors | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {}
  return null
}

function saveCustomColors(colors: ThemeColors | null) {
  try {
    if (colors) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {}
}

function applyCustomColors(colors: ThemeColors) {
  const root = document.documentElement
  root.style.setProperty('--color-bg', colors.background)
  root.style.setProperty('--color-surface', colors.surface)
  root.style.setProperty('--color-sidebar', colors.sidebar)
  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-text', colors.text)
  root.style.setProperty('--color-muted', colors.muted)
  root.style.setProperty('--color-accent', colors.accent)
  root.style.setProperty('--color-editor-bg', colors.editorBg)
}

function removeCustomColors() {
  const root = document.documentElement
  root.style.removeProperty('--color-bg')
  root.style.removeProperty('--color-surface')
  root.style.removeProperty('--color-sidebar')
  root.style.removeProperty('--color-border')
  root.style.removeProperty('--color-text')
  root.style.removeProperty('--color-muted')
  root.style.removeProperty('--color-accent')
  root.style.removeProperty('--color-editor-bg')
}

export const useCustomThemeStore = create<CustomThemeState>((set, get) => ({
  customColors: loadCustomColors(),

  setCustomColors: (colors) => {
    set({ customColors: colors })
    saveCustomColors(colors)
    applyCustomColors(colors)
  },

  resetCustomColors: () => {
    set({ customColors: null })
    saveCustomColors(null)
    removeCustomColors()
  },

  getColors: () => {
    return get().customColors || DEFAULT_COLORS
  },
}))

export { DEFAULT_COLORS, DARK_COLORS }
export type { ThemeColors }
