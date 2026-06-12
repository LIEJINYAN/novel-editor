import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCloudConfig,
  saveCloudConfig,
  clearCloudConfig,
  testConnection,
  getSyncStatus,
} from '../services/cloudSync'
import * as idb from '../utils/idb'

vi.mock('../utils/idb', () => ({
  getAllFromIndexedDB: vi.fn(),
  saveToIndexedDB: vi.fn(),
}))

describe('cloudSync', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should get empty config', () => {
    expect(getCloudConfig()).toBeNull()
  })

  it('should save and get config', () => {
    const config = { provider: 'webdav' as const, server: 'https://dav.example.com', username: 'u', password: 'p' }
    saveCloudConfig(config)
    expect(getCloudConfig()).toEqual(config)
  })

  it('should clear config', () => {
    saveCloudConfig({ provider: 'webdav', server: 's', username: 'u', password: 'p' })
    clearCloudConfig()
    expect(getCloudConfig()).toBeNull()
  })

  it('should test WebDAV connection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const result = await testConnection({ provider: 'webdav', server: 'https://dav.example.com', username: 'u', password: 'p' })
    expect(result).toBe(true)
  })

  it('should test GitHub connection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const result = await testConnection({ provider: 'github', token: 'ghp_test' })
    expect(result).toBe(true)
  })

  it('should test Gitee connection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const result = await testConnection({ provider: 'gitee', token: 'gitee_test' })
    expect(result).toBe(true)
  })

  it('should handle connection failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await testConnection({ provider: 'webdav', server: 's', username: 'u', password: 'p' })
    expect(result).toBe(false)
  })

  it('should handle non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await testConnection({ provider: 'github', token: 'bad' })
    expect(result).toBe(false)
  })

  it('should return default sync status', () => {
    const status = getSyncStatus()
    expect(status.lastSync).toBeNull()
    expect(status.isSyncing).toBe(false)
    expect(status.error).toBeNull()
  })

  it('should handle corrupted sync status', () => {
    localStorage.setItem('novel-engine-sync-status', '{invalid')
    const status = getSyncStatus()
    expect(status.lastSync).toBeNull()
  })

  it('should handle unknown provider', async () => {
    const result = await testConnection({ provider: 'unknown' as any })
    expect(result).toBe(false)
  })

  // BUG: loadConfig handles corrupted JSON gracefully
  it('should handle corrupted config', () => {
    localStorage.setItem('novel-engine-cloud-config', '{bad json')
    expect(getCloudConfig()).toBeNull()
  })
})
