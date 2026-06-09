import { getAllFromIndexedDB, saveToIndexedDB, getFromIndexedDB, deleteFromIndexedDB } from '../utils/idb'

export type CloudProvider = 'webdav' | 'github' | 'gitee'

interface CloudConfig {
  provider: CloudProvider
  server?: string
  username?: string
  password?: string
  token?: string
  repo?: string
  path?: string
}

interface SyncStatus {
  lastSync: number | null
  isSyncing: boolean
  error: string | null
}

const STORAGE_KEY = 'novel-engine-cloud-config'
const SYNC_KEY = 'novel-engine-sync-status'

function loadConfig(): CloudConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveConfig(config: CloudConfig | null) {
  try {
    if (config) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {}
}

function loadSyncStatus(): SyncStatus {
  try {
    const stored = localStorage.getItem(SYNC_KEY)
    return stored ? JSON.parse(stored) : { lastSync: null, isSyncing: false, error: null }
  } catch {
    return { lastSync: null, isSyncing: false, error: null }
  }
}

function saveSyncStatus(status: SyncStatus) {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(status))
  } catch {}
}

export function getCloudConfig(): CloudConfig | null {
  return loadConfig()
}

export function saveCloudConfig(config: CloudConfig) {
  saveConfig(config)
}

export function clearCloudConfig() {
  saveConfig(null)
}

export async function testConnection(config: CloudConfig): Promise<boolean> {
  try {
    if (config.provider === 'webdav') {
      const response = await fetch(`${config.server}/`, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
          'Depth': '0',
        },
      })
      return response.ok
    }

    if (config.provider === 'github' || config.provider === 'gitee') {
      const baseUrl = config.provider === 'github' ? 'https://api.github.com' : 'https://gitee.com/api/v5'
      const response = await fetch(`${baseUrl}/user`, {
        headers: {
          'Authorization': `token ${config.token}`,
        },
      })
      return response.ok
    }

    return false
  } catch {
    return false
  }
}

async function uploadToWebDAV(config: CloudConfig, data: object): Promise<void> {
  const path = config.path || '/novel-engine/'
  const filename = `backup_${Date.now()}.json`
  const url = `${config.server}${path}${filename}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('WebDAV upload failed')
  }
}

async function uploadToGitHub(config: CloudConfig, data: object): Promise<void> {
  const baseUrl = 'https://api.github.com'
  const path = config.path || 'novel-engine-backup'
  const filename = `backup_${Date.now()}.json`

  const content = btoa(JSON.stringify(data))

  const response = await fetch(`${baseUrl}/repos/${config.repo}/contents/${path}/${filename}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Backup from NovelEngine at ${new Date().toISOString()}`,
      content,
    }),
  })

  if (!response.ok) {
    throw new Error('GitHub upload failed')
  }
}

export async function syncToCloud(): Promise<void> {
  const config = loadConfig()
  if (!config) {
    throw new Error('未配置云同步')
  }

  const status = loadSyncStatus()
  status.isSyncing = true
  status.error = null
  saveSyncStatus(status)

  try {
    const documents = await getAllFromIndexedDB('documents')
    const syncData = {
      version: 1,
      timestamp: Date.now(),
      documents,
    }

    if (config.provider === 'webdav') {
      await uploadToWebDAV(config, syncData)
    } else if (config.provider === 'github' || config.provider === 'gitee') {
      await uploadToGitHub(config, syncData)
    }

    status.lastSync = Date.now()
    status.isSyncing = false
    saveSyncStatus(status)
  } catch (error: any) {
    status.isSyncing = false
    status.error = error.message || '同步失败'
    saveSyncStatus(status)
    throw error
  }
}

export function getSyncStatus(): SyncStatus {
  return loadSyncStatus()
}
