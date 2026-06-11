import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile, exists, readDir, mkdir, remove, rename } from '@tauri-apps/plugin-fs'
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { check } from '@tauri-apps/plugin-updater'
import { t } from '../i18n'

let restartFn: (() => void) | null = null

export function setRestartFn(fn: () => void) {
  restartFn = fn
}

// --- Window Management ---
export async function showWindow() {
  const win = getCurrentWebviewWindow()
  await win.show()
  await win.setFocus()
}

export async function hideWindow() {
  const win = getCurrentWebviewWindow()
  await win.hide()
}

export async function createNewWindow(title: string) {
  await invoke('plugin:shell|open', { url: 'index.html', args: [] })
  // Fallback: emit event to main window
  const win = getCurrentWebviewWindow()
  await win.emit('create-new-window', { title })
}

export async function createWindow(url: string): Promise<void> {
  try {
    await invoke('plugin:shell|open', { url, args: [] })
  } catch {
    const win = getCurrentWebviewWindow()
    await win.emit('create-new-window', { url })
  }
}

export function onWindowCreated(callback: (data: { url: string }) => void): Promise<UnlistenFn> {
  return listen<{ url: string }>('create-new-window', (event) => {
    callback(event.payload)
  })
}

// --- File Dialogs ---
export async function openFileDialog(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [
      { name: t('tauri.textFile'), extensions: ['txt', 'md', 'markdown'] },
      { name: t('tauri.novelFile'), extensions: ['novel', 'json'] },
      { name: t('tauri.allFiles'), extensions: ['*'] },
    ],
  })
  if (typeof selected === 'string') return selected
  return null
}

export async function openDirectoryDialog(): Promise<string | null> {
  const selected = await open({ directory: true })
  if (typeof selected === 'string') return selected
  return null
}

export async function saveFileDialog(defaultName?: string): Promise<string | null> {
  const path = await save({
    defaultPath: defaultName,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: t('tauri.textFile'), extensions: ['txt'] },
      { name: 'HTML', extensions: ['html'] },
      { name: t('tauri.allFiles'), extensions: ['*'] },
    ],
  })
  return path
}

// --- File System ---
export async function readFile(path: string): Promise<string> {
  return await readTextFile(path)
}

export async function writeFile(path: string, content: string): Promise<void> {
  await writeTextFile(path, content)
}

export async function fileExists(path: string): Promise<boolean> {
  return await exists(path)
}

export async function readDirectory(path: string) {
  return await readDir(path)
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

export async function deleteFile(path: string): Promise<void> {
  await remove(path)
}

export async function renameFileOp(from: string, to: string): Promise<void> {
  await rename(from, to)
}

// --- Clipboard ---
export async function copyToClipboard(text: string): Promise<void> {
  await writeText(text)
}

export async function readClipboard(): Promise<string> {
  return await readText()
}

// --- Notifications ---
export async function notify(title: string, body: string): Promise<void> {
  await sendNotification({ title, body })
}

// --- Auto Update ---
export async function checkForUpdates(): Promise<{ available: boolean; version?: string; notes?: string }> {
  try {
    const update = await check()
    if (update) {
      return {
        available: true,
        version: update.version,
        notes: update.body,
      }
    }
    return { available: false }
  } catch {
    return { available: false }
  }
}

export async function installUpdate(): Promise<void> {
  const update = await check()
  if (update) {
    await update.downloadAndInstall()
    // Restart app after install
    if (restartFn) {
      restartFn()
    }
  }
}

// --- Event Listeners ---
export function onFileDrop(callback: (paths: string[]) => void): Promise<UnlistenFn> {
  return listen<string[]>('tauri://file-drop', (event: { payload: string[] }) => {
    callback(event.payload)
  })
}

export function onFileDropHover(callback: (paths: string[]) => void): Promise<UnlistenFn> {
  return listen<string[]>('tauri://file-drop-hover', (event: { payload: string[] }) => {
    callback(event.payload)
  })
}

export function onFileDropCancelled(callback: () => void): Promise<UnlistenFn> {
  return listen('tauri://file-drop-cancelled', () => {
    callback()
  })
}

export function onNewDocument(callback: () => void): Promise<UnlistenFn> {
  return listen('tauri://new-document', () => {
    callback()
  })
}

export function onCreateNewWindow(callback: (data: { title: string }) => void): Promise<UnlistenFn> {
  return listen<{ title: string }>('create-new-window', (event: { payload: { title: string } }) => {
    callback(event.payload)
  })
}

export function onDeepLink(callback: (urls: string[]) => void): Promise<UnlistenFn> {
  return listen<string[]>('deep-link://new-url', (event: { payload: string[] }) => {
    callback(event.payload)
  })
}
