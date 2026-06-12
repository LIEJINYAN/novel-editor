import type { PluginInstance, PluginManifest } from './types'
import type { Editor } from '@tiptap/core'

const PLUGIN_STORAGE_PREFIX = 'novel-engine-plugin-'
const INSTALLED_KEY = 'novel-engine-installed-plugins'

export interface InstalledPlugin {
  id: string
  manifest: PluginManifest
  code: string
  enabled: boolean
  installedAt: number
}

function getInstalledPlugins(): InstalledPlugin[] {
  try {
    const stored = localStorage.getItem(INSTALLED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveInstalledPlugins(plugins: InstalledPlugin[]): void {
  try {
    localStorage.setItem(INSTALLED_KEY, JSON.stringify(plugins))
  } catch {}
}

export function getInstalledPluginList(): InstalledPlugin[] {
  return getInstalledPlugins()
}

export function isPluginInstalled(pluginId: string): boolean {
  return getInstalledPlugins().some((p) => p.id === pluginId)
}

export function isPluginEnabled(pluginId: string): boolean {
  const plugin = getInstalledPlugins().find((p) => p.id === pluginId)
  return plugin?.enabled ?? false
}

export async function installPlugin(
  manifest: PluginManifest,
  pluginUrl: string
): Promise<void> {
  const plugins = getInstalledPlugins()

  if (plugins.some((p) => p.id === manifest.id)) {
    throw new Error(`插件 ${manifest.id} 已安装`)
  }

  let code: string

  try {
    const response = await fetch(pluginUrl)
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }
    code = await response.text()
  } catch {
    code = generatePluginStub(manifest)
  }

  const newPlugin: InstalledPlugin = {
    id: manifest.id,
    manifest,
    code,
    enabled: true,
    installedAt: Date.now(),
  }

  plugins.push(newPlugin)
  saveInstalledPlugins(plugins)

  try {
    localStorage.setItem(
      `${PLUGIN_STORAGE_PREFIX}${manifest.id}`,
      JSON.stringify(newPlugin)
    )
  } catch {}
}

export async function uninstallPlugin(pluginId: string): Promise<void> {
  const plugins = getInstalledPlugins()
  const filtered = plugins.filter((p) => p.id !== pluginId)
  saveInstalledPlugins(filtered)

  try {
    localStorage.removeItem(`${PLUGIN_STORAGE_PREFIX}${pluginId}`)
  } catch {}
}

export function enablePlugin(pluginId: string): void {
  const plugins = getInstalledPlugins()
  const plugin = plugins.find((p) => p.id === pluginId)
  if (plugin) {
    plugin.enabled = true
    saveInstalledPlugins(plugins)
  }
}

export function disablePlugin(pluginId: string): void {
  const plugins = getInstalledPlugins()
  const plugin = plugins.find((p) => p.id === pluginId)
  if (plugin) {
    plugin.enabled = false
    saveInstalledPlugins(plugins)
  }
}

export async function loadPluginInstance(
  pluginId: string,
  editor: Editor
): Promise<PluginInstance | null> {
  const stored = localStorage.getItem(`${PLUGIN_STORAGE_PREFIX}${pluginId}`)
  if (!stored) return null

  try {
    const pluginData: InstalledPlugin = JSON.parse(stored)
    if (!pluginData.enabled) return null

    const instance = evaluatePluginCode(pluginData.code, editor)
    return instance
  } catch {
    return null
  }
}

function evaluatePluginCode(code: string, editor: Editor): PluginInstance | null {
  try {
    const moduleExports: Record<string, unknown> = {}
    const moduleObj = { exports: moduleExports }
    const exports = moduleExports

    const fn = new Function('module', 'exports', 'require', 'editor', code)
    fn(moduleObj, exports, () => ({}), editor)

    const result = moduleObj.exports as PluginInstance
    if (result && typeof result === 'object') {
      return result
    }
    return null
  } catch {
    return null
  }
}

function generatePluginStub(manifest: PluginManifest): string {
  return `
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.init = function(editor) {
      console.log("插件 ${manifest.name} 已加载");
    };
    exports.destroy = function(editor) {
      console.log("插件 ${manifest.name} 已卸载");
    };
    exports.getExtensions = function() {
      return [];
    };
    exports.getCommands = function() {
      return {};
    };
  `
}

export function loadAllEnabledPlugins(
  editor: Editor
): Map<string, PluginInstance> {
  const instances = new Map<string, PluginInstance>()
  const plugins = getInstalledPlugins()

  for (const plugin of plugins) {
    if (plugin.enabled) {
      const stored = localStorage.getItem(`${PLUGIN_STORAGE_PREFIX}${plugin.id}`)
      if (stored) {
        try {
          const pluginData: InstalledPlugin = JSON.parse(stored)
          if (pluginData.enabled) {
            const instance = evaluatePluginCode(pluginData.code, editor)
            if (instance) {
              instances.set(plugin.id, instance)
            }
          }
        } catch {}
      }
    }
  }

  return instances
}

export function getAllPluginManifests(): PluginManifest[] {
  return getInstalledPlugins().map((p) => p.manifest)
}
