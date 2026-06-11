import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  registerPlugin,
  unregisterPlugin,
  getPlugin,
  getAllPlugins,
  getEnabledPlugins,
  enablePlugin,
  disablePlugin,
  loadPluginConfig,
  savePluginConfig,
  getPluginExtensions,
  type Plugin,
} from '../services/pluginSystem'

const makePlugin = (overrides: Partial<Plugin> = {}): Plugin => ({
  id: `p_${Math.random().toString(36).slice(2, 8)}`,
  name: 'Test Plugin',
  version: '1.0.0',
  enabled: false,
  ...overrides,
})

beforeEach(() => {
  getAllPlugins().forEach((p) => unregisterPlugin(p.id))
  localStorage.clear()
})

describe('registerPlugin / getPlugin / getAllPlugins', () => {
  it('basic CRUD', () => {
    const plugin = makePlugin({ id: 'test-1' })
    registerPlugin(plugin)

    expect(getPlugin('test-1')).toBe(plugin)
    expect(getAllPlugins()).toContain(plugin)
  })
})

describe('unregisterPlugin', () => {
  it('removes plugin', () => {
    const plugin = makePlugin({ id: 'test-2' })
    registerPlugin(plugin)
    unregisterPlugin('test-2')
    expect(getPlugin('test-2')).toBeUndefined()
    expect(getAllPlugins()).not.toContain(plugin)
  })
})

describe('enablePlugin / disablePlugin', () => {
  it('toggles enabled and saves config', () => {
    const plugin = makePlugin({ id: 'test-3', enabled: false })
    registerPlugin(plugin)

    enablePlugin('test-3')
    expect(plugin.enabled).toBe(true)
    const config = loadPluginConfig()
    expect(config.plugins).toContain('test-3')

    disablePlugin('test-3')
    expect(plugin.enabled).toBe(false)
    const updated = loadPluginConfig()
    expect(updated.plugins).not.toContain('test-3')
  })
})

describe('getEnabledPlugins', () => {
  it('filters enabled only', () => {
    registerPlugin(makePlugin({ id: 'a', enabled: true }))
    registerPlugin(makePlugin({ id: 'b', enabled: false }))
    registerPlugin(makePlugin({ id: 'c', enabled: true }))

    const enabled = getEnabledPlugins()
    expect(enabled.map((p) => p.id)).toEqual(['a', 'c'])
  })
})

describe('loadPluginConfig / savePluginConfig', () => {
  it('round-trips through localStorage', () => {
    savePluginConfig({ plugins: ['x', 'y'] })
    const loaded = loadPluginConfig()
    expect(loaded.plugins).toEqual(['x', 'y'])
  })

  it('returns default when nothing stored', () => {
    const loaded = loadPluginConfig()
    expect(loaded).toEqual({ plugins: [] })
  })
})

describe('getPluginExtensions', () => {
  it('returns extensions from enabled plugins only', () => {
    const ext1 = { name: 'ext1' } as any
    const ext2 = { name: 'ext2' } as any

    registerPlugin(makePlugin({ id: 'pe1', enabled: true, getExtensions: () => [ext1] }))
    registerPlugin(makePlugin({ id: 'pe2', enabled: false, getExtensions: () => [ext2] }))
    registerPlugin(makePlugin({ id: 'pe3', enabled: true }))

    const extensions = getPluginExtensions()
    expect(extensions).toEqual([ext1])
  })
})
