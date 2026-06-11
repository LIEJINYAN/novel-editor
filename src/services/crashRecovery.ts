import { saveToIndexedDB, getAllFromIndexedDB } from '../utils/idb'

const CRASH_KEY = 'novel-engine-crash-recovery'
const AUTO_BACKUP_INTERVAL = 5 * 60 * 1000

let autoBackupTimer: ReturnType<typeof setInterval> | null = null

export interface CrashRecoveryData {
  lastContent: any
  lastDocId: string | null
  timestamp: number
  recovered: boolean
}

export async function saveCrashRecoveryData(data: Omit<CrashRecoveryData, 'timestamp' | 'recovered'>): Promise<void> {
  try {
    await saveToIndexedDB(CRASH_KEY, {
      ...data,
      timestamp: Date.now(),
      recovered: false,
    })
  } catch {}
}

export async function getCrashRecoveryData(): Promise<CrashRecoveryData | null> {
  try {
    const data = await getAllFromIndexedDB(CRASH_KEY)
    if (data.length > 0) {
      return data[0] as CrashRecoveryData
    }
  } catch {}
  return null
}

export async function clearCrashRecoveryData(): Promise<void> {
  try {
    await saveToIndexedDB(CRASH_KEY, null)
  } catch {}
}

export async function hasCrashRecoveryData(): Promise<boolean> {
  const data = await getCrashRecoveryData()
  return data !== null && !data.recovered
}

export function startAutoBackup(getContent: () => any, getDocId: () => string | null): void {
  stopAutoBackup()
  autoBackupTimer = setInterval(async () => {
    const content = getContent()
    const docId = getDocId()
    if (content && docId) {
      await saveCrashRecoveryData({ lastContent: content, lastDocId: docId })
    }
  }, AUTO_BACKUP_INTERVAL)
}

export function stopAutoBackup(): void {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer)
    autoBackupTimer = null
  }
}

export function setupCrashDetection(): void {
  window.addEventListener('beforeunload', () => {
    stopAutoBackup()
  })

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopAutoBackup()
    }
  })
}
