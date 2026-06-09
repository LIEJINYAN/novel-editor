interface FileDialogOptions {
  title?: string
  defaultPath?: string
  filters?: Array<{ name: string; extensions: string[] }>
}

interface TauriBridge {
  isTauri: boolean
  openFileDialog: (options?: FileDialogOptions) => Promise<string | null>
  saveFileDialog: (options?: FileDialogOptions) => Promise<string | null>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  getVersion: () => Promise<string>
}

declare global {
  interface Window {
    __TAURI__?: {
      dialog: {
        open: (options?: FileDialogOptions) => Promise<string | null>
        save: (options?: FileDialogOptions) => Promise<string | null>
      }
      fs: {
        readTextFile: (path: string) => Promise<string>
        writeTextFile: (path: string, content: string) => Promise<void>
      }
      app: {
        getVersion: () => Promise<string>
      }
    }
  }
}

async function openFileDialog(options?: FileDialogOptions): Promise<string | null> {
  if (window.__TAURI__) {
    return window.__TAURI__.dialog.open(options)
  }
  return null
}

async function saveFileDialog(options?: FileDialogOptions): Promise<string | null> {
  if (window.__TAURI__) {
    return window.__TAURI__.dialog.save(options)
  }
  return null
}

async function readFile(path: string): Promise<string> {
  if (window.__TAURI__) {
    return window.__TAURI__.fs.readTextFile(path)
  }
  throw new Error('File system not available in browser')
}

async function writeFile(path: string, content: string): Promise<void> {
  if (window.__TAURI__) {
    await window.__TAURI__.fs.writeTextFile(path, content)
    return
  }
  throw new Error('File system not available in browser')
}

async function getVersion(): Promise<string> {
  if (window.__TAURI__) {
    return window.__TAURI__.app.getVersion()
  }
  return '0.1.0-web'
}

export const tauriBridge: TauriBridge = {
  isTauri: typeof window !== 'undefined' && !!window.__TAURI__,
  openFileDialog,
  saveFileDialog,
  readFile,
  writeFile,
  getVersion,
}
