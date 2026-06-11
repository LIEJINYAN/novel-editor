import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTabStore } from '../store/tabStore'

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

describe('tabStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    useTabStore.setState({
      openTabs: [],
      activeTabId: null,
      maxTabs: 10,
      recentlyClosed: [],
    })
  })

  it('should have correct default state', () => {
    const state = useTabStore.getState()
    expect(state.openTabs).toEqual([])
    expect(state.activeTabId).toBeNull()
    expect(state.maxTabs).toBe(10)
    expect(state.recentlyClosed).toEqual([])
  })

  it('openTab adds a tab and sets activeTabId', () => {
    useTabStore.getState().openTab('doc1', 'First Doc')
    const state = useTabStore.getState()
    expect(state.openTabs).toHaveLength(1)
    expect(state.openTabs[0].docId).toBe('doc1')
    expect(state.openTabs[0].title).toBe('First Doc')
    expect(state.activeTabId).toBe('doc1')
    expect(state.openTabs[0].lastAccessed).toBe(Date.now())
  })

  it('openTab same docId twice does not duplicate', () => {
    const { openTab } = useTabStore.getState()
    openTab('doc1', 'First Doc')
    vi.setSystemTime(new Date('2025-01-01T00:00:01Z'))
    openTab('doc1', 'Updated Title')
    const state = useTabStore.getState()
    expect(state.openTabs).toHaveLength(1)
    expect(state.openTabs[0].lastAccessed).toBe(Date.now())
    expect(state.activeTabId).toBe('doc1')
  })

  it('openTab exceeding maxTabs evicts oldest to recentlyClosed', () => {
    const { openTab } = useTabStore.getState()
    useTabStore.setState({ maxTabs: 3 })
    for (let i = 1; i <= 3; i++) {
      vi.setSystemTime(new Date(`2025-01-01T00:00:0${i}Z`))
      openTab(`doc${i}`, `Doc ${i}`)
    }
    vi.setSystemTime(new Date('2025-01-01T00:00:04Z'))
    openTab('doc4', 'Doc 4')
    const state = useTabStore.getState()
    expect(state.openTabs).toHaveLength(3)
    expect(state.openTabs.map((t) => t.docId)).toContain('doc4')
    expect(state.openTabs.map((t) => t.docId)).not.toContain('doc1')
    expect(state.recentlyClosed).toHaveLength(1)
    expect(state.recentlyClosed[0].docId).toBe('doc1')
  })

  it('closeTab removes tab and switches activeTabId to adjacent', () => {
    const { openTab, closeTab } = useTabStore.getState()
    openTab('doc1', 'Doc 1')
    vi.setSystemTime(new Date('2025-01-01T00:00:01Z'))
    openTab('doc2', 'Doc 2')
    vi.setSystemTime(new Date('2025-01-01T00:00:02Z'))
    openTab('doc3', 'Doc 3')
    closeTab('doc2')
    const state = useTabStore.getState()
    expect(state.openTabs).toHaveLength(2)
    expect(state.activeTabId).toBe('doc3')
    expect(state.recentlyClosed[0].docId).toBe('doc2')
  })

  it('closeTab active tab sets activeTabId to null when last tab', () => {
    const { openTab, closeTab } = useTabStore.getState()
    openTab('doc1', 'Doc 1')
    closeTab('doc1')
    const state = useTabStore.getState()
    expect(state.openTabs).toHaveLength(0)
    expect(state.activeTabId).toBeNull()
  })

  it('reopenTab restores from recentlyClosed', () => {
    const { openTab, closeTab, reopenTab } = useTabStore.getState()
    openTab('doc1', 'Doc 1')
    vi.setSystemTime(new Date('2025-01-01T00:00:01Z'))
    openTab('doc2', 'Doc 2')
    closeTab('doc1')
    expect(useTabStore.getState().recentlyClosed).toHaveLength(1)
    reopenTab('doc1')
    const state = useTabStore.getState()
    expect(state.openTabs.find((t) => t.docId === 'doc1')).toBeDefined()
    expect(state.recentlyClosed).toHaveLength(0)
  })

  it('reopenTab with unknown docId is a no-op', () => {
    const { openTab, closeTab, reopenTab } = useTabStore.getState()
    openTab('doc1', 'Doc 1')
    closeTab('doc1')
    reopenTab('unknown')
    const state = useTabStore.getState()
    expect(state.recentlyClosed).toHaveLength(1)
    expect(state.openTabs).toHaveLength(0)
  })

  it('setActiveTab changes activeTabId', () => {
    const { openTab, setActiveTab } = useTabStore.getState()
    openTab('doc1', 'Doc 1')
    openTab('doc2', 'Doc 2')
    setActiveTab('doc1')
    expect(useTabStore.getState().activeTabId).toBe('doc1')
  })

  it('updateTabTitle updates title for specific docId', () => {
    const { openTab, updateTabTitle } = useTabStore.getState()
    openTab('doc1', 'Old Title')
    updateTabTitle('doc1', 'New Title')
    expect(useTabStore.getState().openTabs[0].title).toBe('New Title')
  })

  it('clearRecentlyClosed empties recentlyClosed', () => {
    const { openTab, closeTab, clearRecentlyClosed } = useTabStore.getState()
    openTab('doc1', 'Doc 1')
    closeTab('doc1')
    expect(useTabStore.getState().recentlyClosed).toHaveLength(1)
    clearRecentlyClosed()
    expect(useTabStore.getState().recentlyClosed).toEqual([])
  })

  it('saveSession and loadSession round-trip via localStorage', () => {
    const { openTab, saveSession, loadSession } = useTabStore.getState()
    openTab('doc1', 'Doc 1')
    vi.setSystemTime(new Date('2025-01-01T00:00:01Z'))
    openTab('doc2', 'Doc 2')
    saveSession()
    useTabStore.setState({ openTabs: [], activeTabId: null })
    loadSession()
    const state = useTabStore.getState()
    expect(state.openTabs).toHaveLength(2)
    expect(state.activeTabId).toBe('doc2')
  })

  it('clearSession removes from localStorage and resets state', () => {
    const { openTab, saveSession, clearSession } = useTabStore.getState()
    openTab('doc1', 'Doc 1')
    saveSession()
    clearSession()
    const state = useTabStore.getState()
    expect(state.openTabs).toEqual([])
    expect(state.activeTabId).toBeNull()
  })
})
