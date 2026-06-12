import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createBackup,
  getBackups,
  restoreBackup,
  exportBackup,
  importBackup,
  deleteBackup,
} from '../services/backupService'
import * as idb from '../utils/idb'

vi.mock('../utils/idb', () => ({
  getAllFromIndexedDB: vi.fn(),
  saveToIndexedDB: vi.fn(),
  getFromIndexedDB: vi.fn(),
  deleteFromIndexedDB: vi.fn(),
}))

describe('backupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a backup', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([{ id: '1', title: 'doc1' }])
    vi.mocked(idb.saveToIndexedDB).mockResolvedValue()

    const backup = await createBackup()
    expect(backup.id).toContain('backup_')
    expect(backup.documents).toEqual([{ id: '1', title: 'doc1' }])
    expect(backup.metadata.documentCount).toBe(1)
  })

  it('should get backups', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([{ backups: [{ id: 'b1' }] }])
    const backups = await getBackups()
    expect(backups.length).toBe(1)
    expect(backups[0].id).toBe('b1')
  })

  it('should return empty array for no backups', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([])
    const backups = await getBackups()
    expect(backups).toEqual([])
  })

  it('should restore backup', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([
      { backups: [{ id: 'b1', documents: [{ id: 'd1' }], folders: [{ id: 'f1' }] }] },
    ])
    vi.mocked(idb.saveToIndexedDB).mockResolvedValue()

    const result = await restoreBackup('b1')
    expect(result).toBe(true)
    expect(idb.saveToIndexedDB).toHaveBeenCalledWith('documents', { id: 'd1' })
  })

  it('should return false for non-existent backup', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([])
    const result = await restoreBackup('nonexistent')
    expect(result).toBe(false)
  })

  it('should export backup as JSON', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([{ backups: [{ id: 'b1' }] }])
    const json = await exportBackup()
    const parsed = JSON.parse(json)
    expect(Array.isArray(parsed)).toBe(true)
  })

  it('should import valid backup', async () => {
    vi.mocked(idb.saveToIndexedDB).mockResolvedValue()
    const json = JSON.stringify({ backups: [{ id: 'imported' }] })
    const result = await importBackup(json)
    expect(result).toBe(true)
  })

  it('should reject invalid import', async () => {
    const result = await importBackup('not json')
    expect(result).toBe(false)
  })

  it('should reject import without backups array', async () => {
    const result = await importBackup(JSON.stringify({ data: 'no backups' }))
    expect(result).toBe(false)
  })

  it('should delete backup', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([
      { backups: [{ id: 'b1' }, { id: 'b2' }] },
    ])
    vi.mocked(idb.saveToIndexedDB).mockResolvedValue()

    const result = await deleteBackup('b1')
    expect(result).toBe(true)
    expect(idb.saveToIndexedDB).toHaveBeenCalled()
  })

  it('should return false when deleting non-existent backup', async () => {
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([{ backups: [{ id: 'b1' }] }])
    const result = await deleteBackup('nonexistent')
    expect(result).toBe(false)
  })

  // BUG FOUND: restoreBackup saves all docs with same store key
  // Each doc should be saved with its own key
  it('BUG: restoreBackup should save each document individually', async () => {
    const docs = [{ id: 'd1', title: 'Doc 1' }, { id: 'd2', title: 'Doc 2' }]
    vi.mocked(idb.getAllFromIndexedDB).mockResolvedValue([
      { backups: [{ id: 'b1', documents: docs, folders: [] }] },
    ])
    vi.mocked(idb.saveToIndexedDB).mockResolvedValue()

    await restoreBackup('b1')

    // Should save each doc separately
    expect(idb.saveToIndexedDB).toHaveBeenCalledTimes(2)
    expect(idb.saveToIndexedDB).toHaveBeenCalledWith('documents', docs[0])
    expect(idb.saveToIndexedDB).toHaveBeenCalledWith('documents', docs[1])
  })
})
