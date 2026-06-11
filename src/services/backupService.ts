import { getAllFromIndexedDB, saveToIndexedDB } from '../utils/idb'

const BACKUP_KEY = 'novel-engine-backups'
const MAX_BACKUPS = 10

export interface Backup {
  id: string
  timestamp: number
  documents: any[]
  folders: any[]
  metadata: {
    version: string
    documentCount: number
    folderCount: number
  }
}

export async function createBackup(): Promise<Backup> {
  const documents = await getAllFromIndexedDB('documents')
  const folders = await getAllFromIndexedDB('folders')

  const backup: Backup = {
    id: `backup_${Date.now()}`,
    timestamp: Date.now(),
    documents,
    folders,
    metadata: {
      version: '0.1.0',
      documentCount: documents.length,
      folderCount: folders.length,
    },
  }

  const backups = await getBackups()
  backups.unshift(backup)
  if (backups.length > MAX_BACKUPS) {
    backups.pop()
  }
  await saveToIndexedDB(BACKUP_KEY, { backups })

  return backup
}

export async function getBackups(): Promise<Backup[]> {
  try {
    const data = await getAllFromIndexedDB<{ backups: Backup[] }>(BACKUP_KEY)
    if (data.length > 0 && data[0].backups) {
      return data[0].backups
    }
  } catch {}
  return []
}

export async function restoreBackup(backupId: string): Promise<boolean> {
  const backups = await getBackups()
  const backup = backups.find((b) => b.id === backupId)
  if (!backup) return false

  try {
    for (const doc of backup.documents) {
      await saveToIndexedDB('documents', doc)
    }
    for (const folder of backup.folders) {
      await saveToIndexedDB('folders', folder)
    }
    return true
  } catch {
    return false
  }
}

export async function exportBackup(): Promise<string> {
  const backups = await getBackups()
  return JSON.stringify(backups, null, 2)
}

export async function importBackup(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString)
    if (!data.backups || !Array.isArray(data.backups)) {
      return false
    }
    await saveToIndexedDB(BACKUP_KEY, data)
    return true
  } catch {
    return false
  }
}

export async function deleteBackup(backupId: string): Promise<boolean> {
  const backups = await getBackups()
  const filtered = backups.filter((b) => b.id !== backupId)
  if (filtered.length === backups.length) return false

  await saveToIndexedDB(BACKUP_KEY, { backups: filtered })
  return true
}
