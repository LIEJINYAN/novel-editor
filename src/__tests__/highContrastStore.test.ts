import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHighContrastStore } from '../store/highContrastStore'

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

describe('highContrastStore', () => {
  let classListAddSpy: ReturnType<typeof vi.fn>
  let classListRemoveSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    classListAddSpy = vi.fn()
    classListRemoveSpy = vi.fn()
    Object.defineProperty(document.documentElement, 'classList', {
      value: {
        add: classListAddSpy,
        remove: classListRemoveSpy,
        contains: vi.fn(() => false),
        toggle: vi.fn(),
        replace: vi.fn(),
      },
      configurable: true,
    })
    useHighContrastStore.setState({ enabled: false })
  })

  it('should have enabled loaded from localStorage (default false)', () => {
    const state = useHighContrastStore.getState()
    expect(state.enabled).toBe(false)
  })

  it('toggle enables high contrast and persists to localStorage', () => {
    useHighContrastStore.getState().toggle()
    const state = useHighContrastStore.getState()
    expect(state.enabled).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('novel-engine-high-contrast', 'true')
  })

  it('toggle disables high contrast and persists to localStorage', () => {
    useHighContrastStore.setState({ enabled: true })
    useHighContrastStore.getState().toggle()
    const state = useHighContrastStore.getState()
    expect(state.enabled).toBe(false)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('novel-engine-high-contrast', 'false')
  })

  it('toggle adds class on document.documentElement when enabling', () => {
    useHighContrastStore.getState().toggle()
    expect(classListAddSpy).toHaveBeenCalledWith('high-contrast')
  })

  it('toggle removes class on document.documentElement when disabling', () => {
    useHighContrastStore.setState({ enabled: true })
    useHighContrastStore.getState().toggle()
    expect(classListRemoveSpy).toHaveBeenCalledWith('high-contrast')
  })
})
