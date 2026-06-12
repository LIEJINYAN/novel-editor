import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  fetchPluginRegistry,
  fetchPluginManifest,
  clearPluginCache,
} from '../services/pluginSystem/marketApi'

describe('pluginSystem/marketApi', () => {
  beforeEach(() => {
    clearPluginCache()
    vi.restoreAllMocks()
  })

  it('should fetch plugin registry', async () => {
    const plugins = await fetchPluginRegistry()
    expect(plugins).toBeTruthy()
    expect(plugins.length).toBeGreaterThan(0)
  })

  it('should cache plugins after first fetch', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await fetchPluginRegistry()
    await fetchPluginRegistry()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should clear plugin cache', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    await fetchPluginRegistry()
    clearPluginCache()
    await fetchPluginRegistry()
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should fetch plugin manifest by id', async () => {
    const plugin = await fetchPluginManifest('markdown-enhance')
    expect(plugin).toBeTruthy()
    expect(plugin?.id).toBe('markdown-enhance')
    expect(plugin?.name).toBe('Markdown增强')
  })

  it('should return null for non-existent plugin', async () => {
    const plugin = await fetchPluginManifest('non-existent')
    expect(plugin).toBeNull()
  })

  it('should return fallback plugins on fetch error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
    const plugins = await fetchPluginRegistry()
    expect(plugins).toBeTruthy()
    expect(plugins.length).toBe(8)
  })

  it('should return fallback plugins on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)
    const plugins = await fetchPluginRegistry()
    expect(plugins).toBeTruthy()
    expect(plugins.length).toBe(8)
  })

  it('should have correct plugin structure', async () => {
    const plugins = await fetchPluginRegistry()
    const plugin = plugins[0]
    expect(plugin.id).toBeTruthy()
    expect(plugin.name).toBeTruthy()
    expect(plugin.version).toBeTruthy()
    expect(plugin.description).toBeTruthy()
    expect(plugin.author).toBeTruthy()
    expect(plugin.category).toBeTruthy()
    expect(typeof plugin.downloads).toBe('number')
    expect(typeof plugin.rating).toBe('number')
  })
})
