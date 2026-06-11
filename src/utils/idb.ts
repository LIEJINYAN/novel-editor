const DB_NAME = 'NovelEngine'
const DB_VERSION = 2
const MAX_RETRIES = 3
const RETRY_DELAY = 100

let dbInstance: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('agent-memory')) {
          db.createObjectStore('agent-memory', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('agent-history')) {
          db.createObjectStore('agent-history', { keyPath: 'id' })
        }
      }
      request.onsuccess = () => {
        dbInstance = request.result
        dbInstance.onclose = () => {
          dbInstance = null
          dbPromise = null
        }
        resolve(dbInstance)
      }
      request.onerror = () => {
        dbPromise = null
        reject(request.error)
      }
    })
  }
  return dbPromise
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
      return withRetry(fn, retries - 1)
    }
    throw error
  }
}

export async function saveToIndexedDB<T>(storeName: string, data: T): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  return withRetry(async () => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      tx.objectStore(storeName).put(data)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  })
}

export async function getAllFromIndexedDB<T>(storeName: string): Promise<T[]> {
  if (typeof indexedDB === 'undefined') return []
  return withRetry(async () => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const request = tx.objectStore(storeName).getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  })
}

export async function getFromIndexedDB<T>(storeName: string, key: string): Promise<T | undefined> {
  if (typeof indexedDB === 'undefined') return undefined
  return withRetry(async () => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const request = tx.objectStore(storeName).get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  })
}

export async function deleteFromIndexedDB(storeName: string, key: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  return withRetry(async () => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      tx.objectStore(storeName).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  })
}
