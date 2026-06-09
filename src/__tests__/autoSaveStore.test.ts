import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAutoSaveStore } from '../store/autoSaveStore'

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

describe('autoSaveStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    useAutoSaveStore.setState({
      strategy: 'auto',
      interval: 30000,
      autoSaveEnabled: true,
      lastSaved: null,
      lastSavedContent: null,
      hasChanges: false,
      isSaving: false,
    })
  })

  it('should have default values', () => {
    const state = useAutoSaveStore.getState()
    expect(state.strategy).toBe('auto')
    expect(state.interval).toBe(30000)
    expect(state.autoSaveEnabled).toBe(true)
    expect(state.lastSaved).toBeNull()
    expect(state.isSaving).toBe(false)
  })

  it('should set strategy', () => {
    const { setStrategy } = useAutoSaveStore.getState()
    setStrategy('smart')
    expect(useAutoSaveStore.getState().strategy).toBe('smart')
    setStrategy('manual')
    expect(useAutoSaveStore.getState().strategy).toBe('manual')
  })

  it('should set interval', () => {
    const { setInterval } = useAutoSaveStore.getState()
    setInterval(60000)
    expect(useAutoSaveStore.getState().interval).toBe(60000)
    setInterval(10000)
    expect(useAutoSaveStore.getState().interval).toBe(10000)
  })

  it('should toggle auto save', () => {
    const { toggleAutoSave } = useAutoSaveStore.getState()
    expect(useAutoSaveStore.getState().autoSaveEnabled).toBe(true)
    toggleAutoSave()
    expect(useAutoSaveStore.getState().autoSaveEnabled).toBe(false)
    toggleAutoSave()
    expect(useAutoSaveStore.getState().autoSaveEnabled).toBe(true)
  })

  it('should set last saved', () => {
    const { setLastSaved } = useAutoSaveStore.getState()
    const now = Date.now()
    setLastSaved(now)
    expect(useAutoSaveStore.getState().lastSaved).toBe(now)
  })

  it('should set saving state', () => {
    const { setSaving } = useAutoSaveStore.getState()
    setSaving(true)
    expect(useAutoSaveStore.getState().isSaving).toBe(true)
    setSaving(false)
    expect(useAutoSaveStore.getState().isSaving).toBe(false)
  })

  it('should evaluate shouldSave for auto strategy', () => {
    const { shouldSave, setLastSavedContent } = useAutoSaveStore.getState()
    setLastSavedContent('old content')
    expect(shouldSave('new content')).toBe(true)
    expect(shouldSave('old content')).toBe(false)
  })

  it('should evaluate shouldSave for manual strategy', () => {
    const { shouldSave, setStrategy } = useAutoSaveStore.getState()
    setStrategy('manual')
    expect(shouldSave('new content')).toBe(false)
  })

  it('should evaluate shouldSave when disabled', () => {
    const { shouldSave, toggleAutoSave } = useAutoSaveStore.getState()
    toggleAutoSave()
    expect(shouldSave('new content')).toBe(false)
  })

  it('should evaluate shouldSave for smart strategy', () => {
    const { shouldSave, setStrategy, setLastSavedContent, setLastSaved, setHasChanges } = useAutoSaveStore.getState()
    setStrategy('smart')
    setLastSavedContent('old content')
    setHasChanges(true)
    setLastSaved(Date.now() - 60000)
    expect(shouldSave('new content with more than 50 chars difference' + 'x'.repeat(60))).toBe(true)
  })

  it('should persist to localStorage', () => {
    const { setStrategy } = useAutoSaveStore.getState()
    setStrategy('manual')
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })
})
