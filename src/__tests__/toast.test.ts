import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  showToast,
  showSuccess,
  showError,
  showWarning,
  setToastCallback,
} from '../utils/toast'

beforeEach(() => {
  setToastCallback(null as any)
})

describe('setToastCallback', () => {
  it('registers callback', () => {
    const cb = vi.fn()
    setToastCallback(cb)
    showToast('test')
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('showToast', () => {
  it('calls registered callback with correct message and type', () => {
    const cb = vi.fn()
    setToastCallback(cb)
    showToast('hello', 'info', 3000)
    expect(cb).toHaveBeenCalledWith({ message: 'hello', type: 'info', duration: 3000 })
  })

  it('without callback: no-op', () => {
    const cb = vi.fn()
    setToastCallback(null as any)
    expect(() => showToast('msg')).not.toThrow()
  })
})

describe('showSuccess', () => {
  it('calls callback with type success', () => {
    const cb = vi.fn()
    setToastCallback(cb)
    showSuccess('done')
    expect(cb).toHaveBeenCalledWith({ message: 'done', type: 'success', duration: undefined })
  })
})

describe('showError', () => {
  it('calls callback with type error and duration 5000', () => {
    const cb = vi.fn()
    setToastCallback(cb)
    showError('fail')
    expect(cb).toHaveBeenCalledWith({ message: 'fail', type: 'error', duration: 5000 })
  })
})

describe('showWarning', () => {
  it('calls callback with type warning and duration 4000', () => {
    const cb = vi.fn()
    setToastCallback(cb)
    showWarning('caution')
    expect(cb).toHaveBeenCalledWith({ message: 'caution', type: 'warning', duration: 4000 })
  })
})
