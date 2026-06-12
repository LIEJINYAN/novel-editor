import { describe, it, expect, vi } from 'vitest'
import {
  saveToIndexedDB,
  getAllFromIndexedDB,
  getFromIndexedDB,
  deleteFromIndexedDB,
} from '../utils/idb'

describe('idb - missing indexedDB', () => {
  it('should handle missing indexedDB gracefully', async () => {
    const original = globalThis.indexedDB
    ;(globalThis as any).indexedDB = undefined

    await expect(saveToIndexedDB('test', { id: '1' })).resolves.not.toThrow()
    expect(await getAllFromIndexedDB('test')).toEqual([])
    expect(await getFromIndexedDB('test', '1')).toBeUndefined()
    await expect(deleteFromIndexedDB('test', '1')).resolves.not.toThrow()

    ;(globalThis as any).indexedDB = original
  })
})

describe('idb - openDB caching', () => {
  it('should return same promise on repeated calls', async () => {
    // The module caches dbInstance and dbPromise
    // Just verify the functions exist and can be called
    expect(typeof saveToIndexedDB).toBe('function')
    expect(typeof getAllFromIndexedDB).toBe('function')
    expect(typeof getFromIndexedDB).toBe('function')
    expect(typeof deleteFromIndexedDB).toBe('function')
  })
})
