import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWordGoalStore } from '../store/wordGoalStore'

describe('WordGoalStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useWordGoalStore.setState({
      goals: { daily: 1000, chapter: 5000, novel: 50000 },
      progress: { daily: 0, chapter: 0, novel: 0, lastResetDate: new Date().toISOString().split('T')[0] },
    })
  })

  it('should set daily goal', () => {
    const { setDailyGoal, goals } = useWordGoalStore.getState()
    setDailyGoal(2000)
    expect(useWordGoalStore.getState().goals.daily).toBe(2000)
  })

  it('should set chapter goal', () => {
    const { setChapterGoal } = useWordGoalStore.getState()
    setChapterGoal(10000)
    expect(useWordGoalStore.getState().goals.chapter).toBe(10000)
  })

  it('should set novel goal', () => {
    const { setNovelGoal } = useWordGoalStore.getState()
    setNovelGoal(100000)
    expect(useWordGoalStore.getState().goals.novel).toBe(100000)
  })

  it('should add word count', () => {
    const { addWordCount } = useWordGoalStore.getState()
    addWordCount(500)
    const { progress } = useWordGoalStore.getState()
    expect(progress.daily).toBe(500)
    expect(progress.chapter).toBe(500)
    expect(progress.novel).toBe(500)
  })

  it('should calculate daily percent', () => {
    const { addWordCount, setDailyGoal } = useWordGoalStore.getState()
    setDailyGoal(1000)
    addWordCount(500)
    expect(useWordGoalStore.getState().getDailyPercent()).toBe(50)
  })

  it('should calculate chapter percent', () => {
    const { addWordCount, setChapterGoal } = useWordGoalStore.getState()
    setChapterGoal(5000)
    addWordCount(2500)
    expect(useWordGoalStore.getState().getChapterPercent()).toBe(50)
  })

  it('should calculate novel percent', () => {
    const { addWordCount, setNovelGoal } = useWordGoalStore.getState()
    setNovelGoal(50000)
    addWordCount(25000)
    expect(useWordGoalStore.getState().getNovelPercent()).toBe(50)
  })

  it('should cap percent at 100', () => {
    const { addWordCount, setDailyGoal } = useWordGoalStore.getState()
    setDailyGoal(100)
    addWordCount(200)
    expect(useWordGoalStore.getState().getDailyPercent()).toBe(100)
  })

  it('should reset daily progress', () => {
    const { addWordCount, resetDailyProgress } = useWordGoalStore.getState()
    addWordCount(500)
    resetDailyProgress()
    expect(useWordGoalStore.getState().progress.daily).toBe(0)
  })

  it('should reset chapter progress', () => {
    const { addWordCount, resetChapterProgress } = useWordGoalStore.getState()
    addWordCount(500)
    resetChapterProgress()
    expect(useWordGoalStore.getState().progress.chapter).toBe(0)
  })

  it('should reset novel progress', () => {
    const { addWordCount, resetNovelProgress } = useWordGoalStore.getState()
    addWordCount(500)
    resetNovelProgress()
    expect(useWordGoalStore.getState().progress.novel).toBe(0)
  })

  it('should persist goals to localStorage', () => {
    const { setDailyGoal } = useWordGoalStore.getState()
    setDailyGoal(3000)
    const stored = JSON.parse(localStorage.getItem('novel-engine-word-goals') || '{}')
    expect(stored.daily).toBe(3000)
  })

  it('should persist progress to localStorage', () => {
    const { addWordCount } = useWordGoalStore.getState()
    addWordCount(100)
    const stored = JSON.parse(localStorage.getItem('novel-engine-word-progress') || '{}')
    expect(stored.daily).toBe(100)
  })
})
