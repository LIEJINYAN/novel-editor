import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUIStore } from '../store/uiStore'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('uiStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    useUIStore.setState({
      focusMode: false,
      typewriterMode: false,
      fullscreen: false,
      sidebarOpen: true,
      aiPanelOpen: true,
      editorFocused: false,
      focusToolbarMode: 'auto',
    })
  })

  it('should have correct default state', () => {
    const state = useUIStore.getState()
    expect(state.focusMode).toBe(false)
    expect(state.typewriterMode).toBe(false)
    expect(state.fullscreen).toBe(false)
    expect(state.sidebarOpen).toBe(true)
    expect(state.aiPanelOpen).toBe(true)
    expect(state.editorFocused).toBe(false)
    expect(state.focusToolbarMode).toBe('auto')
  })

  it('toggleFocusMode toggles and persists to localStorage', () => {
    useUIStore.getState().toggleFocusMode()
    expect(useUIStore.getState().focusMode).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('novel-engine-focus-mode', 'true')
    useUIStore.getState().toggleFocusMode()
    expect(useUIStore.getState().focusMode).toBe(false)
  })

  it('toggleTypewriterMode toggles and persists to localStorage', () => {
    useUIStore.getState().toggleTypewriterMode()
    expect(useUIStore.getState().typewriterMode).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('novel-engine-typewriter-mode', 'true')
    useUIStore.getState().toggleTypewriterMode()
    expect(useUIStore.getState().typewriterMode).toBe(false)
  })

  it('toggleFullscreen calls requestFullscreen/exitFullscreen', () => {
    const requestFullscreen = vi.fn()
    const exitFullscreen = vi.fn()
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      value: requestFullscreen,
      configurable: true,
    })
    Object.defineProperty(document, 'exitFullscreen', {
      value: exitFullscreen,
      configurable: true,
    })

    useUIStore.setState({ fullscreen: false })
    useUIStore.getState().toggleFullscreen()
    expect(useUIStore.getState().fullscreen).toBe(true)
    expect(requestFullscreen).toHaveBeenCalled()

    useUIStore.getState().toggleFullscreen()
    expect(useUIStore.getState().fullscreen).toBe(false)
    expect(exitFullscreen).toHaveBeenCalled()
  })

  it('setSidebarOpen sets sidebarOpen', () => {
    useUIStore.getState().setSidebarOpen(false)
    expect(useUIStore.getState().sidebarOpen).toBe(false)
    useUIStore.getState().setSidebarOpen(true)
    expect(useUIStore.getState().sidebarOpen).toBe(true)
  })

  it('setAiPanelOpen sets aiPanelOpen', () => {
    useUIStore.getState().setAiPanelOpen(false)
    expect(useUIStore.getState().aiPanelOpen).toBe(false)
    useUIStore.getState().setAiPanelOpen(true)
    expect(useUIStore.getState().aiPanelOpen).toBe(true)
  })

  it('setEditorFocused sets editorFocused', () => {
    useUIStore.getState().setEditorFocused(true)
    expect(useUIStore.getState().editorFocused).toBe(true)
    useUIStore.getState().setEditorFocused(false)
    expect(useUIStore.getState().editorFocused).toBe(false)
  })

  it('setFocusToolbarMode sets mode and persists to localStorage', () => {
    useUIStore.getState().setFocusToolbarMode('always')
    expect(useUIStore.getState().focusToolbarMode).toBe('always')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('novel-engine-focus-toolbar-mode', 'always')
    useUIStore.getState().setFocusToolbarMode('never')
    expect(useUIStore.getState().focusToolbarMode).toBe('never')
  })

  it('toggleFocusToolbarMode cycles auto->always->never->auto', () => {
    useUIStore.setState({ focusToolbarMode: 'auto' })
    useUIStore.getState().toggleFocusToolbarMode()
    expect(useUIStore.getState().focusToolbarMode).toBe('always')
    useUIStore.getState().toggleFocusToolbarMode()
    expect(useUIStore.getState().focusToolbarMode).toBe('never')
    useUIStore.getState().toggleFocusToolbarMode()
    expect(useUIStore.getState().focusToolbarMode).toBe('auto')
  })
})
