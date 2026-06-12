import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  saveCrashRecoveryData,
  getCrashRecoveryData,
  clearCrashRecoveryData,
  hasCrashRecoveryData,
  startAutoBackup,
  stopAutoBackup,
  setupCrashDetection,
} from '../services/crashRecovery'
import * as idb from '../utils/idb'

vi.mock('../utils/idb', () => ({
  saveToIndexedDB: vi.fn(),
  getAllFromIndexedDB: vi.fn(),
}))

describe('crashRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    stopAutoBackup()
  })

  afterEach(() => {
    vi.useRealTimers()
    stopAutoBackup()
  })

  it('should save crash recovery data', async () => {
    vi.mocked(idb.saveToIndexedDB).mockResolvedValue()
    await saveCrashRecoveryData({ lastContent: 'test', lastDocId: 'doc1' })
    expect(idb.saveToIndexedDB).toHaveBeenCalled()
    const call = vi.mocked(idb.saveToIndexedDB).mock.calls[0]
    expect(call[0]).toBe('novel-engine-crash-recovery')
    expect((call[1] as any).lastContent).toBe('test')
    expect((call[1] as any).recovered).toBe(false)
  })

  it('should get crash recovery data', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([
      { lastContent: 'test', lastDocId: 'd1', timestamp: 123, recovered: false },
    ])
    const data = await getCrashRecoveryData()
    expect(data).toBeTruthy()
    expect(data?.lastContent).toBe('test')
  })

  it('should return null for no data', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([])
    const data = await getCrashRecoveryData()
    expect(data).toBeNull()
  })

  it('should clear crash recovery data', async () => {
    vi.mocked(idb.saveToIndexedDB).mockResolvedValue()
    await clearCrashRecoveryData()
    expect(idb.saveToIndexedDB).toHaveBeenCalledWith('novel-engine-crash-recovery', null)
  })

  it('should detect crash recovery data available', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([
      { lastContent: 'test', lastDocId: 'd1', timestamp: 123, recovered: false },
    ])
    const has = await hasCrashRecoveryData()
    expect(has).toBe(true)
  })

  it('should not flag recovered data', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([
      { lastContent: 'test', lastDocId: 'd1', timestamp: 123, recovered: true },
    ])
    const has = await hasCrashRecoveryData()
    expect(has).toBe(false)
  })

  it('should start and stop auto backup', () => {
    const getContent = vi.fn().mockReturnValue('content')
    const getDocId = vi.fn().mockReturnValue('doc1')

    startAutoBackup(getContent, getDocId)
    vi.mocked(idb.saveToIndexedDB).mockResolvedValue()

    // Advance timer by 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(getContent).toHaveBeenCalled()
    expect(getDocId).toHaveBeenCalled()

    stopAutoBackup()
  })

  it('should stop auto backup', () => {
    startAutoBackup(() => 'c', () => 'd')
    stopAutoBackup()
    // Should not throw
  })

  // BUG: setupCrashDetection adds event listeners but has no way to remove them
  it('should setup crash detection', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    setupCrashDetection()
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    addSpy.mockRestore()
  })

  // BUG: clearCrashRecoveryData saves null, but getAllFromIndexedDB may fail
  it('should handle errors gracefully', async () => {
    vi.mocked(idb.saveToIndexedDB).mockRejectedValue(new Error('DB error'))
    // Should not throw
    await expect(saveCrashRecoveryData({ lastContent: 'c', lastDocId: 'd' })).resolves.not.toThrow()
  })
})
