import { create } from 'zustand'

export type FocusToolbarMode = 'auto' | 'always' | 'never'

interface UIState {
  focusMode: boolean
  typewriterMode: boolean
  fullscreen: boolean
  sidebarOpen: boolean
  aiPanelOpen: boolean
  editorFocused: boolean
  focusToolbarMode: FocusToolbarMode
  toggleFocusMode: () => void
  toggleTypewriterMode: () => void
  toggleFullscreen: () => void
  setSidebarOpen: (open: boolean) => void
  setAiPanelOpen: (open: boolean) => void
  setEditorFocused: (focused: boolean) => void
  setFocusToolbarMode: (mode: FocusToolbarMode) => void
  toggleFocusToolbarMode: () => void
}

const FOCUS_MODE_KEY = 'novel-engine-focus-mode'
const TYPEWRITER_MODE_KEY = 'novel-engine-typewriter-mode'
const FOCUS_TOOLBAR_MODE_KEY = 'novel-engine-focus-toolbar-mode'

function getInitialFocusMode(): boolean {
  try {
    return localStorage.getItem(FOCUS_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

function getInitialTypewriterMode(): boolean {
  try {
    return localStorage.getItem(TYPEWRITER_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

function getInitialFocusToolbarMode(): FocusToolbarMode {
  try {
    const stored = localStorage.getItem(FOCUS_TOOLBAR_MODE_KEY) as FocusToolbarMode | null
    if (stored && ['auto', 'always', 'never'].includes(stored)) {
      return stored
    }
  } catch {}
  return 'auto'
}

export const useUIStore = create<UIState>((set) => ({
  focusMode: getInitialFocusMode(),
  typewriterMode: getInitialTypewriterMode(),
  fullscreen: false,
  sidebarOpen: true,
  aiPanelOpen: true,
  editorFocused: false,
  focusToolbarMode: getInitialFocusToolbarMode(),

  toggleFocusMode: () =>
    set((state) => {
      const newMode = !state.focusMode
      localStorage.setItem(FOCUS_MODE_KEY, String(newMode))
      return { focusMode: newMode }
    }),

  toggleTypewriterMode: () =>
    set((state) => {
      const newMode = !state.typewriterMode
      localStorage.setItem(TYPEWRITER_MODE_KEY, String(newMode))
      return { typewriterMode: newMode }
    }),

  toggleFullscreen: () =>
    set((state) => {
      if (!state.fullscreen) {
        document.documentElement.requestFullscreen?.()
      } else {
        document.exitFullscreen?.()
      }
      return { fullscreen: !state.fullscreen }
    }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
  setEditorFocused: (focused) => set({ editorFocused: focused }),

  setFocusToolbarMode: (mode) =>
    set(() => {
      localStorage.setItem(FOCUS_TOOLBAR_MODE_KEY, mode)
      return { focusToolbarMode: mode }
    }),

  toggleFocusToolbarMode: () =>
    set((state) => {
      const modes: FocusToolbarMode[] = ['auto', 'always', 'never']
      const currentIndex = modes.indexOf(state.focusToolbarMode)
      const nextMode = modes[(currentIndex + 1) % modes.length]
      localStorage.setItem(FOCUS_TOOLBAR_MODE_KEY, nextMode)
      return { focusToolbarMode: nextMode }
    }),
}))
