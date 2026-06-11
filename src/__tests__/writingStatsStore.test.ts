import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWritingStatsStore } from '../store/writingStatsStore'

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

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

describe('useWritingStatsStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    useWritingStatsStore.setState({
      dailyStats: {},
      currentSessionStart: null,
      totalWordsWritten: 0,
      totalTimeSpent: 0,
    })
  })

  it('should have correct default values', () => {
    const state = useWritingStatsStore.getState()
    expect(state.dailyStats).toEqual({})
    expect(state.currentSessionStart).toBeNull()
    expect(state.totalWordsWritten).toBe(0)
    expect(state.totalTimeSpent).toBe(0)
  })

  describe('startSession', () => {
    it('should set currentSessionStart to Date.now()', () => {
      const before = Date.now()
      useWritingStatsStore.getState().startSession()
      const after = Date.now()
      const start = useWritingStatsStore.getState().currentSessionStart
      expect(start).toBeGreaterThanOrEqual(before)
      expect(start).toBeLessThanOrEqual(after)
    })
  })

  describe('endSession', () => {
    it('should calculate duration, update dailyStats, and clear currentSessionStart', () => {
      useWritingStatsStore.getState().startSession()
      const sessionStart = useWritingStatsStore.getState().currentSessionStart!
      vi.useFakeTimers()
      vi.setSystemTime(sessionStart + 5000)

      useWritingStatsStore.getState().endSession()

      const state = useWritingStatsStore.getState()
      expect(state.currentSessionStart).toBeNull()
      const todayKey = getTodayKey()
      expect(state.dailyStats[todayKey]).toBeDefined()
      expect(state.dailyStats[todayKey].timeSpent).toBe(5)
      expect(state.dailyStats[todayKey].sessionsCount).toBe(1)
      expect(state.totalTimeSpent).toBe(5)
      vi.useRealTimers()
    })

    it('should be a no-op without startSession', () => {
      useWritingStatsStore.getState().endSession()
      expect(useWritingStatsStore.getState().currentSessionStart).toBeNull()
      expect(useWritingStatsStore.getState().dailyStats).toEqual({})
    })
  })

  describe('updateWordCount', () => {
    it('should calculate wordsDelta and update dailyStats', () => {
      useWritingStatsStore.getState().updateWordCount(100)
      const state1 = useWritingStatsStore.getState()
      expect(state1.totalWordsWritten).toBe(100)
      expect(state1.dailyStats[getTodayKey()].wordsWritten).toBe(100)

      useWritingStatsStore.getState().updateWordCount(150)
      const state2 = useWritingStatsStore.getState()
      expect(state2.totalWordsWritten).toBe(150)
      expect(state2.dailyStats[getTodayKey()].wordsWritten).toBe(150)
    })
  })

  describe('getTodayStats', () => {
    it('should return today stats or defaults', () => {
      const stats = useWritingStatsStore.getState().getTodayStats()
      expect(stats).toEqual({
        date: getTodayKey(),
        wordsWritten: 0,
        timeSpent: 0,
        sessionsCount: 0,
      })
    })

    it('should return updated stats after writing', () => {
      useWritingStatsStore.getState().updateWordCount(50)
      const stats = useWritingStatsStore.getState().getTodayStats()
      expect(stats.wordsWritten).toBe(50)
    })
  })

  describe('getWeekStats', () => {
    it('should return array of 7 DailyStats', () => {
      const stats = useWritingStatsStore.getState().getWeekStats()
      expect(stats).toHaveLength(7)
      expect(stats[6].date).toBe(getTodayKey())
    })
  })

  describe('getMonthStats', () => {
    it('should return array of 30 DailyStats', () => {
      const stats = useWritingStatsStore.getState().getMonthStats()
      expect(stats).toHaveLength(30)
      expect(stats[29].date).toBe(getTodayKey())
    })
  })

  describe('localStorage persistence', () => {
    it('should save stats to localStorage on updateWordCount', () => {
      useWritingStatsStore.getState().updateWordCount(50)
      expect(localStorageMock.setItem).toHaveBeenCalled()
      const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1]
      expect(lastCall[0]).toBe('novel-engine-writing-stats')
      const saved = JSON.parse(lastCall[1])
      expect(saved[getTodayKey()].wordsWritten).toBe(50)
    })

    it('should save stats to localStorage on endSession', () => {
      useWritingStatsStore.getState().startSession()
      useWritingStatsStore.getState().endSession()
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })
})
