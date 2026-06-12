import type { Editor } from '@tiptap/core'
import type { Extension } from '@tiptap/core'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon: string
  category: PluginCategory
  main: string
  minAppVersion?: string
  dependencies?: string[]
  permissions?: PluginPermission[]
}

export type PluginCategory =
  | 'editor'
  | 'ai'
  | 'export'
  | 'theme'
  | 'writing'
  | 'productivity'

export type PluginPermission =
  | 'editor'
  | 'storage'
  | 'network'
  | 'notifications'

export interface Plugin {
  manifest: PluginManifest
  enabled: boolean
  installed: boolean
  installedAt?: number
  enabledAt?: number
  instance?: PluginInstance
}

export interface PluginInstance {
  init?: (editor: Editor) => void
  destroy?: (editor: Editor) => void
  getExtensions?: () => Extension[]
  getCommands?: () => Record<string, (...args: any[]) => void>
  getToolbarItems?: () => PluginToolbarItem[]
  getSidebarPanels?: () => PluginSidebarPanel[]
}

export interface PluginToolbarItem {
  id: string
  label: string
  icon: string
  action: (editor: Editor) => void
}

export interface PluginSidebarPanel {
  id: string
  title: string
  icon: string
  component: React.ComponentType<{ editor: Editor }>
}

export interface PluginMarketItem extends PluginManifest {
  downloads: number
  rating: number
  reviewCount: number
  screenshots?: string[]
  repository?: string
  homepage?: string
}

export interface PluginStore {
  installed: Plugin[]
  loadInstalled: () => void
  saveInstalled: () => void
  installPlugin: (item: PluginMarketItem) => Promise<void>
  uninstallPlugin: (pluginId: string) => Promise<void>
  enablePlugin: (pluginId: string) => void
  disablePlugin: (pluginId: string) => void
  getEnabledPlugins: () => Plugin[]
}
