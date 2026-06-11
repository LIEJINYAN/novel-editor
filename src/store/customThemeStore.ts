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

export const THEME_PRESETS: { name: string; colors: ThemeColors; icon: string }[] = [
  { name: '默认亮色', colors: DEFAULT_COLORS, icon: '☀️' },
  { name: '默认暗色', colors: DARK_COLORS, icon: '🌙' },
  {
    name: '护眼模式', icon: '👁️',
    colors: {
      background: '#c7edcc',
      surface: '#d4edda',
      sidebar: '#b8e0bc',
      border: '#a3d9a8',
      text: '#2d4a32',
      muted: '#5a7d60',
      accent: '#28a745',
      editorBg: '#d1ecf1',
    },
  },
  {
    name: '复古牛皮纸', icon: '📜',
    colors: {
      background: '#f4ecd8',
      surface: '#efe6cc',
      sidebar: '#e8dcc4',
      border: '#d4c5a0',
      text: '#4a3728',
      muted: '#8b7355',
      accent: '#b8860b',
      editorBg: '#faf6eb',
    },
  },
  {
    name: '深夜写作', icon: '🌃',
    colors: {
      background: '#0d1117',
      surface: '#161b22',
      sidebar: '#0d1117',
      border: '#30363d',
      text: '#c9d1d9',
      muted: '#8b949e',
      accent: '#58a6ff',
      editorBg: '#0d1117',
    },
  },
  {
    name: '樱花粉', icon: '🌸',
    colors: {
      background: '#fff0f5',
      surface: '#ffe4ec',
      sidebar: '#ffd6e0',
      border: '#ffb6c1',
      text: '#4a3040',
      muted: '#8b6070',
      accent: '#ff69b4',
      editorBg: '#fffaf0',
    },
  },
  {
    name: '海洋蓝', icon: '🌊',
    colors: {
      background: '#f0f8ff',
      surface: '#e6f3ff',
      sidebar: '#d9ecff',
      border: '#b3d9ff',
      text: '#1a3a5c',
      muted: '#4a7a9c',
      accent: '#007bff',
      editorBg: '#f8fcff',
    },
  },
  {
    name: '森林绿', icon: '🌲',
    colors: {
      background: '#f0fff0',
      surface: '#e6ffe6',
      sidebar: '#d9ffd9',
      border: '#b3ffb3',
      text: '#1a3a1a',
      muted: '#4a7a4a',
      accent: '#28a745',
      editorBg: '#f8fff8',
    },
  },
  {
    name: '极简黑白', icon: '⚫',
    colors: {
      background: '#ffffff',
      surface: '#fafafa',
      sidebar: '#f5f5f5',
      border: '#e0e0e0',
      text: '#000000',
      muted: '#666666',
      accent: '#000000',
      editorBg: '#ffffff',
    },
  },
]

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
