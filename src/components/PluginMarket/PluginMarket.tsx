import { useState } from 'react'

interface Props {
  onClose: () => void
}

interface Plugin {
  id: string
  name: string
  icon: string
  version: string
  author: string
  description: string
  category: string
  installed: boolean
  enabled: boolean
  downloads: number
}

const PLUGIN_LIST: Plugin[] = [
  {
    id: 'markdown-export',
    name: 'Markdown增强',
    icon: '📝',
    version: '1.0.0',
    author: 'NovelEngine',
    description: '增强的Markdown导出功能，支持更多格式选项',
    category: '导出增强',
    installed: true,
    enabled: true,
    downloads: 1250,
  },
  {
    id: 'ai-translate',
    name: 'AI翻译助手',
    icon: '🌐',
    version: '1.2.0',
    author: 'NovelEngine',
    description: '使用AI进行多语言翻译',
    category: 'AI增强',
    installed: true,
    enabled: false,
    downloads: 890,
  },
  {
    id: 'word-count-plus',
    name: '字数统计增强',
    icon: '📊',
    version: '2.0.0',
    author: 'Community',
    description: '更详细的字数统计和分析',
    category: '编辑器扩展',
    installed: false,
    enabled: false,
    downloads: 2100,
  },
  {
    id: 'theme-pack',
    name: '主题包',
    icon: '🎨',
    version: '1.5.0',
    author: 'Community',
    description: '更多预设主题',
    category: '主题',
    installed: false,
    enabled: false,
    downloads: 3200,
  },
  {
    id: 'spell-check',
    name: '拼写检查',
    icon: '🔍',
    version: '1.1.0',
    author: 'NovelEngine',
    description: '中文和英文拼写检查',
    category: '编辑器扩展',
    installed: false,
    enabled: false,
    downloads: 1560,
  },
  {
    id: 'version-control',
    name: '版本控制',
    icon: '📋',
    version: '1.0.0',
    author: 'Community',
    description: 'Git风格的版本管理',
    category: '编辑器扩展',
    installed: false,
    enabled: false,
    downloads: 980,
  },
]

const CATEGORIES = ['全部', '编辑器扩展', 'AI增强', '导出增强', '主题']

export default function PluginMarket({ onClose }: Props) {
  const [plugins, setPlugins] = useState(PLUGIN_LIST)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesCategory = activeCategory === '全部' || plugin.category === activeCategory
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const togglePlugin = (pluginId: string) => {
    setPlugins(plugins.map((p) =>
      p.id === pluginId ? { ...p, enabled: !p.enabled } : p
    ))
  }

  const installPlugin = (pluginId: string) => {
    setPlugins(plugins.map((p) =>
      p.id === pluginId ? { ...p, installed: true, enabled: true } : p
    ))
  }

  const uninstallPlugin = (pluginId: string) => {
    setPlugins(plugins.map((p) =>
      p.id === pluginId ? { ...p, installed: false, enabled: false } : p
    ))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-surface border border-editor-border rounded-lg shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">🧩 插件市场</h2>
          <button onClick={onClose} className="text-editor-muted hover:text-editor-text">✕</button>
        </div>

        <div className="px-4 py-2 border-b border-editor-border">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索插件..."
            className="w-full px-3 py-1.5 text-xs bg-editor-bg border border-editor-border rounded text-editor-text"
          />
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

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className="p-3 bg-editor-bg rounded-lg border border-editor-border"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{plugin.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-editor-text">{plugin.name}</span>
                    <span className="text-[10px] text-editor-muted">v{plugin.version}</span>
                  </div>
                  <p className="text-xs text-editor-muted mt-1">{plugin.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-editor-muted">
                    <span>👤 {plugin.author}</span>
                    <span>📥 {plugin.downloads}</span>
                    <span className="px-1.5 py-0.5 bg-editor-surface rounded">{plugin.category}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {plugin.installed ? (
                    <>
                      <button
                        onClick={() => togglePlugin(plugin.id)}
                        className={`px-2 py-1 text-[10px] rounded ${
                          plugin.enabled
                            ? 'bg-green-500 text-white'
                            : 'bg-editor-border text-editor-muted'
                        }`}
                      >
                        {plugin.enabled ? '已启用' : '已禁用'}
                      </button>
                      <button
                        onClick={() => uninstallPlugin(plugin.id)}
                        className="px-2 py-1 text-[10px] text-red-500 hover:bg-red-500/10 rounded"
                      >
                        卸载
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => installPlugin(plugin.id)}
                      className="px-2 py-1 text-[10px] bg-editor-accent text-editor-bg rounded hover:opacity-90"
                    >
                      安装
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-editor-border text-center text-[10px] text-editor-muted">
          共 {filteredPlugins.length} 个插件 | 已安装 {plugins.filter((p) => p.installed).length} 个
        </div>
      </div>
    </div>
  )
}
