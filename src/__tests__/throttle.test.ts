import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { throttle, debounce, batchSave } from '../utils/throttle'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('throttle', () => {
  it('calls function immediately on first call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('delays second call within delay window', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('first')
    expect(fn).toHaveBeenCalledTimes(1)

    throttled('second')
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('second')
  })

  it('third call after delay executes', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('first')
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    throttled('second')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('debounce', () => {
  it('delays execution until delay elapses', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('first')
    vi.advanceTimersByTime(50)
    debounced('second')
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('second')
  })

  it('only last call executes', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    debounced('b')
    debounced('c')

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })
})

describe('batchSave', () => {
  it('splits items into batches and calls saveFn for each', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)
    const items = Array.from({ length: 25 }, (_, i) => i)

    batchSave(items, saveFn, 10, 50)

    await vi.advanceTimersByTimeAsync(50)
    await vi.advanceTimersByTimeAsync(50)

    expect(saveFn).toHaveBeenCalledTimes(3)
    expect(saveFn).toHaveBeenNthCalledWith(1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(saveFn).toHaveBeenNthCalledWith(2, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
    expect(saveFn).toHaveBeenNthCalledWith(3, [20, 21, 22, 23, 24])
  })

  it('handles empty items array', () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)
    batchSave([], saveFn, 10)
    expect(saveFn).not.toHaveBeenCalled()
  })
})
