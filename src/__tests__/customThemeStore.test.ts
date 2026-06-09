import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCustomThemeStore, DEFAULT_COLORS, DARK_COLORS } from '../store/customThemeStore'

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

describe('customThemeStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    useCustomThemeStore.setState({ customColors: null })
  })

  it('should have default colors defined', () => {
    expect(DEFAULT_COLORS.background).toBeDefined()
    expect(DEFAULT_COLORS.text).toBeDefined()
    expect(DEFAULT_COLORS.accent).toBeDefined()
    expect(DARK_COLORS.background).toBeDefined()
    expect(DARK_COLORS.text).toBeDefined()
  })

  it('should start with null custom colors', () => {
    const { customColors } = useCustomThemeStore.getState()
    expect(customColors).toBeNull()
  })

  it('should set custom colors', () => {
    const { setCustomColors } = useCustomThemeStore.getState()
    const newColors = { ...DEFAULT_COLORS, background: '#ff0000' }
    setCustomColors(newColors)
    expect(useCustomThemeStore.getState().customColors?.background).toBe('#ff0000')
  })

  it('should reset custom colors', () => {
    const { setCustomColors, resetCustomColors } = useCustomThemeStore.getState()
    setCustomColors({ ...DEFAULT_COLORS, background: '#ff0000' })
    expect(useCustomThemeStore.getState().customColors).not.toBeNull()
    resetCustomColors()
    expect(useCustomThemeStore.getState().customColors).toBeNull()
  })

  it('should get colors with defaults when no custom', () => {
    const { getColors } = useCustomThemeStore.getState()
    const colors = getColors()
    expect(colors.background).toBe(DEFAULT_COLORS.background)
    expect(colors.text).toBe(DEFAULT_COLORS.text)
  })

  it('should get colors with custom overrides', () => {
    const { setCustomColors, getColors } = useCustomThemeStore.getState()
    setCustomColors({ ...DEFAULT_COLORS, background: '#ff0000' })
    const colors = getColors()
    expect(colors.background).toBe('#ff0000')
    expect(colors.text).toBe(DEFAULT_COLORS.text)
  })

  it('should persist to localStorage', () => {
    const { setCustomColors } = useCustomThemeStore.getState()
    setCustomColors(DEFAULT_COLORS)
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })
})
