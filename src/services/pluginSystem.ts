import type { Editor } from '@tiptap/core'
import type { Extension } from '@tiptap/core'

export interface Plugin {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  enabled: boolean
  init?: (editor: Editor) => void
  destroy?: (editor: Editor) => void
  getExtensions?: () => Extension[]
  getCommands?: () => Record<string, (...args: any[]) => void>
}

export interface PluginConfig {
  plugins: string[]
}

const STORAGE_KEY = 'novel-engine-plugins'

let registeredPlugins: Map<string, Plugin> = new Map()

export function registerPlugin(plugin: Plugin): void {
  registeredPlugins.set(plugin.id, plugin)
}

export function unregisterPlugin(pluginId: string): void {
  registeredPlugins.delete(pluginId)
}

export function getPlugin(pluginId: string): Plugin | undefined {
  return registeredPlugins.get(pluginId)
}

export function getAllPlugins(): Plugin[] {
  return Array.from(registeredPlugins.values())
}

export function getEnabledPlugins(): Plugin[] {
  return getAllPlugins().filter((p) => p.enabled)
}

export function loadPluginConfig(): PluginConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {}
  return { plugins: [] }
}

export function savePluginConfig(config: PluginConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {}
}

export function enablePlugin(pluginId: string): void {
  const plugin = registeredPlugins.get(pluginId)
  if (plugin) {
    plugin.enabled = true
    const config = loadPluginConfig()
    if (!config.plugins.includes(pluginId)) {
      config.plugins.push(pluginId)
      savePluginConfig(config)
    }
  }
}

export function disablePlugin(pluginId: string): void {
  const plugin = registeredPlugins.get(pluginId)
  if (plugin) {
    plugin.enabled = false
    const config = loadPluginConfig()
    config.plugins = config.plugins.filter((id) => id !== pluginId)
    savePluginConfig(config)
  }
}

export function initializePlugins(editor: Editor): void {
  const config = loadPluginConfig()
  const plugins = getAllPlugins()

  for (const plugin of plugins) {
    if (config.plugins.includes(plugin.id)) {
      plugin.enabled = true
      plugin.init?.(editor)
    }
  }
}

export function destroyPlugins(editor: Editor): void {
  const plugins = getAllPlugins()
  for (const plugin of plugins) {
    if (plugin.enabled) {
      plugin.destroy?.(editor)
    }
  }
}

export function getPluginExtensions(): Extension[] {
  const extensions: Extension[] = []
  const plugins = getEnabledPlugins()

  for (const plugin of plugins) {
    const pluginExtensions = plugin.getExtensions?.()
    if (pluginExtensions) {
      extensions.push(...pluginExtensions)
    }
  }

  return extensions
}
