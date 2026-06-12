import type { PluginMarketItem } from './types'

const PLUGIN_REGISTRY_URL = 'https://raw.githubusercontent.com/LIEJINYAN/novel-editor/main/plugins/registry.json'

const FALLBACK_PLUGINS: PluginMarketItem[] = [
  {
    id: 'markdown-enhance',
    name: 'Markdown增强',
    version: '1.0.0',
    description: '增强的Markdown导出功能，支持自定义模板和批量导出',
    author: 'NovelEngine',
    icon: '📝',
    category: 'export',
    main: 'markdown-enhance.js',
    downloads: 1250,
    rating: 4.5,
    reviewCount: 23,
    permissions: ['editor', 'storage'],
  },
  {
    id: 'ai-translate',
    name: 'AI翻译助手',
    version: '1.2.0',
    description: '使用AI进行多语言翻译，支持50+语言',
    author: 'NovelEngine',
    icon: '🌐',
    category: 'ai',
    main: 'ai-translate.js',
    downloads: 890,
    rating: 4.2,
    reviewCount: 15,
    permissions: ['editor', 'network'],
  },
  {
    id: 'word-count-pro',
    name: '字数统计增强',
    version: '2.0.0',
    description: '更详细的字数统计和分析，包括阅读时间估算',
    author: 'Community',
    icon: '📊',
    category: 'productivity',
    main: 'word-count-pro.js',
    downloads: 2100,
    rating: 4.8,
    reviewCount: 45,
    permissions: ['editor'],
  },
  {
    id: 'theme-pack',
    name: '主题包',
    version: '1.5.0',
    description: '更多预设主题，包括护眼模式和夜间模式',
    author: 'Community',
    icon: '🎨',
    category: 'theme',
    main: 'theme-pack.js',
    downloads: 3200,
    rating: 4.6,
    reviewCount: 67,
    permissions: ['storage'],
  },
  {
    id: 'spell-check-plus',
    name: '拼写检查增强',
    version: '1.1.0',
    description: '中文和英文拼写检查，支持自定义词典',
    author: 'NovelEngine',
    icon: '🔍',
    category: 'editor',
    main: 'spell-check-plus.js',
    downloads: 1560,
    rating: 4.3,
    reviewCount: 28,
    permissions: ['editor', 'storage'],
  },
  {
    id: 'version-control',
    name: '版本控制',
    version: '1.0.0',
    description: 'Git风格的版本管理，支持分支和合并',
    author: 'Community',
    icon: '📋',
    category: 'productivity',
    main: 'version-control.js',
    downloads: 980,
    rating: 4.1,
    reviewCount: 12,
    permissions: ['editor', 'storage'],
  },
  {
    id: 'fanfic-tools',
    name: '同人创作工具',
    version: '1.0.0',
    description: '同人小说创作辅助工具，包括角色关系图和时间线',
    author: 'Community',
    icon: '💫',
    category: 'writing',
    main: 'fanfic-tools.js',
    downloads: 450,
    rating: 4.7,
    reviewCount: 8,
    permissions: ['editor'],
  },
  {
    id: 'chapter-manager',
    name: '章节管理器',
    version: '1.2.0',
    description: '可视化章节结构管理，支持拖拽排序',
    author: 'Community',
    icon: '📚',
    category: 'productivity',
    main: 'chapter-manager.js',
    downloads: 780,
    rating: 4.4,
    reviewCount: 19,
    permissions: ['editor', 'storage'],
  },
]

let cachedPlugins: PluginMarketItem[] | null = null

export async function fetchPluginRegistry(): Promise<PluginMarketItem[]> {
  if (cachedPlugins) return cachedPlugins

  try {
    const response = await fetch(PLUGIN_REGISTRY_URL, {
      headers: { Accept: 'application/json' },
    })
    if (response.ok) {
      const data = await response.json()
      cachedPlugins = data.plugins || data
      return cachedPlugins!
    }
  } catch {
    // 静默失败，使用 fallback
  }

  cachedPlugins = FALLBACK_PLUGINS
  return cachedPlugins
}

export async function fetchPluginManifest(pluginId: string): Promise<PluginMarketItem | null> {
  const plugins = await fetchPluginRegistry()
  return plugins.find((p) => p.id === pluginId) || null
}

export function clearPluginCache(): void {
  cachedPlugins = null
}
