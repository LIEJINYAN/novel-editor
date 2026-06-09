import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useShortcutStore, DEFAULT_SHORTCUTS } from '../store/shortcutStore'

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

describe('shortcutStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    const store = useShortcutStore.getState()
    store.shortcuts.forEach((s) => {
      const def = DEFAULT_SHORTCUTS.find((d) => d.id === s.id)
      if (def) {
        useShortcutStore.setState((state) => ({
          shortcuts: state.shortcuts.map((item) =>
            item.id === s.id ? { ...def } : item
          ),
        }))
      }
    })
    useShortcutStore.setState({ editingId: null })
  })

  it('should have default shortcuts', () => {
    const { shortcuts } = useShortcutStore.getState()
    expect(shortcuts.length).toBe(DEFAULT_SHORTCUTS.length)
    expect(shortcuts[0].id).toBe('save')
    expect(shortcuts[0].code).toBe('Ctrl+S')
  })

  it('should update a shortcut', () => {
    const { updateShortcut } = useShortcutStore.getState()
    updateShortcut('save', { key: 'k', ctrl: true })
    const { shortcuts } = useShortcutStore.getState()
    const save = shortcuts.find((s) => s.id === 'save')
    expect(save?.key).toBe('k')
    expect(save?.code).toBe('Ctrl+K')
  })

  it('should update shortcut with shift', () => {
    const { updateShortcut } = useShortcutStore.getState()
    updateShortcut('search', { key: 'F', ctrl: true, shift: true })
    const { shortcuts } = useShortcutStore.getState()
    const search = shortcuts.find((s) => s.id === 'search')
    expect(search?.code).toBe('Ctrl+Shift+F')
  })

  it('should reset a single shortcut', () => {
    const { updateShortcut, resetShortcut } = useShortcutStore.getState()
    updateShortcut('save', { key: 'k' })
    resetShortcut('save')
    const { shortcuts } = useShortcutStore.getState()
    const save = shortcuts.find((s) => s.id === 'save')
    expect(save?.key).toBe('s')
    expect(save?.code).toBe('Ctrl+S')
  })

  it('should reset all shortcuts', () => {
    const { updateShortcut, resetAll } = useShortcutStore.getState()
    updateShortcut('save', { key: 'k' })
    updateShortcut('undo', { key: 'x' })
    resetAll()
    const { shortcuts } = useShortcutStore.getState()
    const save = shortcuts.find((s) => s.id === 'save')
    const undo = shortcuts.find((s) => s.id === 'undo')
    expect(save?.key).toBe('s')
    expect(undo?.key).toBe('z')
  })

  it('should set editing id', () => {
    const { setEditing } = useShortcutStore.getState()
    setEditing('save')
    expect(useShortcutStore.getState().editingId).toBe('save')
    setEditing(null)
    expect(useShortcutStore.getState().editingId).toBeNull()
  })

  it('should get shortcut by id', () => {
    const { getShortcut } = useShortcutStore.getState()
    const save = getShortcut('save')
    expect(save).toBeDefined()
    expect(save?.label).toBe('保存文档')
    expect(getShortcut('nonexistent')).toBeUndefined()
  })

  it('should match shortcut from keyboard event', () => {
    const { matchShortcut } = useShortcutStore.getState()
    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    expect(matchShortcut(event)?.id).toBe('save')

    const event2 = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })
    expect(matchShortcut(event2)?.id).toBe('undo')

    const event3 = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true })
    expect(matchShortcut(event3)).toBeUndefined()
  })

  it('should match shift shortcuts', () => {
    const { matchShortcut } = useShortcutStore.getState()
    const event = new KeyboardEvent('keydown', { key: 'F', ctrlKey: true, shiftKey: true })
    expect(matchShortcut(event)?.id).toBe('focusMode')
  })

  it('should match F1 key', () => {
    const { matchShortcut } = useShortcutStore.getState()
    const event = new KeyboardEvent('keydown', { key: 'F1' })
    expect(matchShortcut(event)?.id).toBe('help')
  })

  it('should match escape key', () => {
    const { matchShortcut } = useShortcutStore.getState()
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    expect(matchShortcut(event)?.id).toBe('exitFocus')
  })

  it('should persist shortcuts to localStorage', () => {
    const { updateShortcut } = useShortcutStore.getState()
    updateShortcut('save', { key: 'k' })
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'novel-engine-shortcuts',
      expect.any(String)
    )
  })
})
