import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import type { PluginMarketItem } from '../../services/pluginSystem/types'
import {
  fetchPluginRegistry,
  clearPluginCache,
} from '../../services/pluginSystem/marketApi'
import {
  isPluginInstalled,
  isPluginEnabled,
  installPlugin,
  uninstallPlugin,
  enablePlugin,
  disablePlugin,
} from '../../services/pluginSystem/loader'

interface Props {
  onClose: () => void
}

const CATEGORY_MAP: Record<string, string> = {
  editor: '编辑器扩展',
  ai: 'AI增强',
  export: '导出增强',
  theme: '主题',
  writing: '写作辅助',
  productivity: '效率工具',
}

const CATEGORIES = ['全部', '编辑器扩展', 'AI增强', '导出增强', '主题', '写作辅助', '效率工具']

function getCategoryLabel(category: string): string {
  return CATEGORY_MAP[category] || category
}

export default function PluginMarket({ onClose }: Props) {
  const [plugins, setPlugins] = useState<PluginMarketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [installingIds, setInstallingIds] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadPlugins()
  }, [])

  async function loadPlugins() {
    setLoading(true)
    try {
      const data = await fetchPluginRegistry()
      setPlugins(data)
    } catch {
      setMessage({ type: 'error', text: '加载插件列表失败' })
    }
    setLoading(false)
  }

  const filteredPlugins = plugins.filter((plugin) => {
    const catLabel = getCategoryLabel(plugin.category)
    const matchesCategory = activeCategory === '全部' || catLabel === activeCategory
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  async function handleInstall(plugin: PluginMarketItem) {
    setInstallingIds((prev) => new Set(prev).add(plugin.id))
    try {
      const pluginUrl = `https://raw.githubusercontent.com/LIEJINYAN/novel-editor/main/plugins/${plugin.id}/${plugin.main}`
      await installPlugin(plugin, pluginUrl)
      setMessage({ type: 'success', text: `${plugin.name} 安装成功` })
    } catch (err) {
      setMessage({ type: 'error', text: `安装失败: ${err instanceof Error ? err.message : '未知错误'}` })
    }
    setInstallingIds((prev) => {
      const next = new Set(prev)
      next.delete(plugin.id)
      return next
    })
  }

  async function handleUninstall(pluginId: string) {
    try {
      await uninstallPlugin(pluginId)
      setMessage({ type: 'success', text: '卸载成功' })
    } catch (err) {
      setMessage({ type: 'error', text: `卸载失败: ${err instanceof Error ? err.message : '未知错误'}` })
    }
  }

  function handleToggle(pluginId: string) {
    if (isPluginEnabled(pluginId)) {
      disablePlugin(pluginId)
      setMessage({ type: 'success', text: '插件已禁用' })
    } else {
      enablePlugin(pluginId)
      setMessage({ type: 'success', text: '插件已启用' })
    }
  }

  function handleRefresh() {
    clearPluginCache()
    loadPlugins()
  }

  function getStatus(pluginId: string): 'installed' | 'available' {
    return isPluginInstalled(pluginId) ? 'installed' : 'available'
  }

  function getIsEnabled(pluginId: string): boolean {
    return isPluginEnabled(pluginId)
  }

  function getIsInstalling(pluginId: string): boolean {
    return installingIds.has(pluginId)
  }

  return (
    <Modal open={true} onClose={onClose} title="🧩 插件市场" size="lg">
      <div className="px-4 py-2 border-b border-editor-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索插件..."
            className="flex-1 px-3 py-1.5 text-xs bg-editor-bg border border-editor-border rounded text-editor-text"
          />
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-xs text-editor-muted hover:text-editor-text hover:bg-editor-surface rounded border border-editor-border"
          >
            刷新
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-4 py-2 border-b border-editor-border overflow-x-auto">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-2 py-1 text-[10px] rounded whitespace-nowrap ${
              activeCategory === category
                ? 'bg-editor-accent text-editor-bg'
                : 'text-editor-muted hover:text-editor-text hover:bg-editor-bg'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {message && (
        <div className={`px-4 py-2 text-xs ${message.type === 'success' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
          {message.text}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[50vh]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-xs text-editor-muted animate-pulse">加载中...</div>
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-xs text-editor-muted">未找到匹配的插件</div>
          </div>
        ) : (
          filteredPlugins.map((plugin) => {
            const status = getStatus(plugin.id)
            const enabled = getIsEnabled(plugin.id)
            const installing = getIsInstalling(plugin.id)

            return (
              <div key={plugin.id} className="p-3 bg-editor-bg rounded-lg border border-editor-border">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{plugin.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-editor-text">{plugin.name}</span>
                      <span className="text-[10px] text-editor-muted">v{plugin.version}</span>
                      {status === 'installed' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${enabled ? 'bg-green-500/20 text-green-400' : 'bg-editor-border text-editor-muted'}`}>
                          {enabled ? '已启用' : '已禁用'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-editor-muted mt-1">{plugin.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-editor-muted">
                      <span>👤 {plugin.author}</span>
                      <span>📥 {plugin.downloads}</span>
                      <span>⭐ {plugin.rating} ({plugin.reviewCount})</span>
                      <span className="px-1.5 py-0.5 bg-editor-surface rounded">{getCategoryLabel(plugin.category)}</span>
                    </div>
                    {plugin.permissions && plugin.permissions.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-[10px] text-editor-muted">权限:</span>
                        {plugin.permissions.map((p) => (
                          <span key={p} className="text-[10px] px-1 py-0.5 bg-yellow-500/10 text-yellow-500 rounded">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {status === 'installed' ? (
                      <>
                        <button
                          onClick={() => handleToggle(plugin.id)}
                          className={`px-2 py-1 text-[10px] rounded ${enabled ? 'bg-green-500 text-white' : 'bg-editor-border text-editor-muted'}`}
                        >
                          {enabled ? '禁用' : '启用'}
                        </button>
                        <button
                          onClick={() => handleUninstall(plugin.id)}
                          className="px-2 py-1 text-[10px] text-red-500 hover:bg-red-500/10 rounded"
                        >
                          卸载
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleInstall(plugin)}
                        disabled={installing}
                        className={`px-2 py-1 text-[10px] rounded ${installing ? 'bg-editor-border text-editor-muted' : 'bg-editor-accent text-editor-bg hover:opacity-90'}`}
                      >
                        {installing ? '安装中...' : '安装'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="px-4 py-2 border-t border-editor-border">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-editor-muted">
            共 {filteredPlugins.length} 个插件 | 已安装 {plugins.filter((p) => isPluginInstalled(p.id)).length} 个
          </span>
          <button
            onClick={() => window.open('https://github.com/LIEJINYAN/novel-editor/blob/main/docs/PLUGIN_DEVELOPMENT.md', '_blank')}
            className="text-[10px] text-editor-accent hover:underline"
          >
            开发插件指南
          </button>
        </div>
      </div>
    </Modal>
  )
}
