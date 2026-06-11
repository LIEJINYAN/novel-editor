import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWordCountStore } from '../store/wordCountStore'

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

describe('wordCountStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    useWordCountStore.setState({ currentCount: 0, totalCount: 0 })
  })

  it('should have default counts of zero', () => {
    const state = useWordCountStore.getState()
    expect(state.currentCount).toBe(0)
    expect(state.totalCount).toBe(0)
  })

  it('setCurrentCount sets count and persists to localStorage', () => {
    useWordCountStore.getState().setCurrentCount(500)
    const state = useWordCountStore.getState()
    expect(state.currentCount).toBe(500)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'novel-engine-wordcount',
      JSON.stringify({ currentCount: 500, totalCount: 0 })
    )
  })

  it('addToTotal adds to totalCount', () => {
    useWordCountStore.getState().addToTotal(100)
    expect(useWordCountStore.getState().totalCount).toBe(100)
    useWordCountStore.getState().addToTotal(250)
    expect(useWordCountStore.getState().totalCount).toBe(350)
  })

  it('addToTotal persists to localStorage', () => {
    useWordCountStore.getState().addToTotal(100)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'novel-engine-wordcount',
      expect.any(String)
    )
  })

  it('localStorage round-trip', () => {
    useWordCountStore.getState().setCurrentCount(123)
    useWordCountStore.getState().addToTotal(456)
    const stored = JSON.parse(localStorageMock.setItem.mock.calls.slice(-1)[0][1])
    expect(stored.currentCount).toBe(123)
    expect(stored.totalCount).toBe(456)
  })
})
