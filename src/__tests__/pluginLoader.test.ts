import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getInstalledPluginList,
  isPluginInstalled,
  isPluginEnabled,
  installPlugin,
  uninstallPlugin,
  enablePlugin,
  disablePlugin,
  getAllPluginManifests,
} from '../services/pluginSystem/loader'
import type { PluginManifest } from '../services/pluginSystem/types'

const mockManifest: PluginManifest = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  author: 'Test Author',
  icon: '🔌',
  category: 'editor',
  main: 'index.js',
  permissions: [],
}

const mockManifest2: PluginManifest = {
  id: 'test-plugin-2',
  name: 'Test Plugin 2',
  version: '1.0.0',
  description: 'Another test plugin',
  author: 'Test Author',
  icon: '🧩',
  category: 'ai',
  main: 'index.js',
  permissions: [],
}

describe('pluginSystem/loader', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return empty list initially', () => {
    const plugins = getInstalledPluginList()
    expect(plugins).toEqual([])
  })

  it('should check if plugin is installed', () => {
    expect(isPluginInstalled('test-plugin')).toBe(false)
  })

  it('should check if plugin is enabled', () => {
    expect(isPluginEnabled('test-plugin')).toBe(false)
  })

  it('should get all plugin manifests', () => {
    const manifests = getAllPluginManifests()
    expect(manifests).toEqual([])
  })

  it('should install a plugin', async () => {
    await installPlugin(mockManifest, 'http://example.com/plugin.js')
    expect(isPluginInstalled('test-plugin')).toBe(true)
    expect(isPluginEnabled('test-plugin')).toBe(true)
  })

  it('should not install duplicate plugin', async () => {
    await installPlugin(mockManifest, 'http://example.com/plugin.js')
    await expect(installPlugin(mockManifest, 'http://example.com/plugin.js')).rejects.toThrow('已安装')
  })

  it('should uninstall a plugin', async () => {
    await installPlugin(mockManifest, 'http://example.com/plugin.js')
    expect(isPluginInstalled('test-plugin')).toBe(true)
    await uninstallPlugin('test-plugin')
    expect(isPluginInstalled('test-plugin')).toBe(false)
  })

  it('should enable a plugin', async () => {
    await installPlugin(mockManifest, 'http://example.com/plugin.js')
    disablePlugin('test-plugin')
    expect(isPluginEnabled('test-plugin')).toBe(false)
    enablePlugin('test-plugin')
    expect(isPluginEnabled('test-plugin')).toBe(true)
  })

  it('should disable a plugin', async () => {
    await installPlugin(mockManifest, 'http://example.com/plugin.js')
    expect(isPluginEnabled('test-plugin')).toBe(true)
    disablePlugin('test-plugin')
    expect(isPluginEnabled('test-plugin')).toBe(false)
  })

  it('should get all plugin manifests', async () => {
    await installPlugin(mockManifest, 'http://example.com/plugin.js')
    await installPlugin(mockManifest2, 'http://example.com/plugin2.js')
    const manifests = getAllPluginManifests()
    expect(manifests.length).toBe(2)
    expect(manifests[0].id).toBe('test-plugin')
    expect(manifests[1].id).toBe('test-plugin-2')
  })

  it('should handle enable/disable non-existent plugin', () => {
    enablePlugin('non-existent')
    disablePlugin('non-existent')
    expect(isPluginEnabled('non-existent')).toBe(false)
  })

  it('should store plugin data in localStorage', async () => {
    await installPlugin(mockManifest, 'http://example.com/plugin.js')
    const stored = localStorage.getItem('novel-engine-plugin-test-plugin')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.id).toBe('test-plugin')
    expect(parsed.enabled).toBe(true)
  })
})
