# NovelEngine Editor API 文档

## 概述

NovelEngine Editor 提供了一套完整的 API 用于扩展和集成。

## Store API

### useDocumentStore

文档管理 Store。

```typescript
import { useDocumentStore } from '../store/documentStore'

const {
  documents,
  currentDocId,
  addDoc,
  updateDoc,
  deleteDoc,
  setCurrentDoc,
} = useDocumentStore()
```

#### 方法

| 方法 | 参数 | 返回值 | 描述 |
|------|------|--------|------|
| `addDoc` | `doc: Omit<Document, 'id' \| 'updatedAt'>` | `string` | 创建新文档，返回文档ID |
| `updateDoc` | `id: string, updates: Partial<Document>` | `void` | 更新文档内容 |
| `deleteDoc` | `id: string` | `void` | 删除文档 |
| `setCurrentDoc` | `id: string` | `void` | 设置当前文档 |

### useTabStore

标签页管理 Store。

```typescript
import { useTabStore } from '../store/tabStore'

const {
  tabs,
  currentTabId,
  openTab,
  closeTab,
  switchTab,
} = useTabStore()
```

### useAIStore

AI 功能 Store。

```typescript
import { useAIStore } from '../store/aiStore'

const {
  settings,
  updateSettings,
  isGenerating,
} = useAIStore()
```

### useWritingStatsStore

写作统计 Store。

```typescript
import { useWritingStatsStore } from '../store/writingStatsStore'

const {
  dailyStats,
  startSession,
  endSession,
  updateWordCount,
  getTodayStats,
  getWeekStats,
  getMonthStats,
} = useWritingStatsStore()
```

### useCustomThemeStore

自定义主题 Store。

```typescript
import { useCustomThemeStore } from '../store/customThemeStore'

const {
  colors,
  updateColor,
  resetColors,
  applyTheme,
  getColors,
} = useCustomThemeStore()
```

### useShortcutStore

快捷键 Store。

```typescript
import { useShortcutStore } from '../store/shortcutStore'

const {
  shortcuts,
  updateShortcut,
  resetShortcuts,
  matchShortcut,
} = useShortcutStore()
```

### useCollaborationStore

协作 Store。

```typescript
import { useCollaborationStore } from '../store/collaborationStore'

const {
  isConnected,
  collaborators,
  connect,
  disconnect,
  sendOperation,
  sendCursorUpdate,
} = useCollaborationStore()
```

## Service API

### AI Service

AI 服务接口。

```typescript
import { generateAI, generateAIStream } from '../services/aiService'

// 同步生成
const result = await generateAI(prompt, options)

// 流式生成
const stream = await generateAIStream(prompt, options)
```

### Export Service

导出服务。

```typescript
import {
  exportToMarkdown,
  exportToHTML,
  exportToPDF,
  exportToTXT,
  exportToDOCX,
  exportToEPUB,
  batchExport,
} from '../utils/export'

exportToMarkdown(title, content)
exportToHTML(title, content)
exportToPDF(title, content)
exportToTXT(title, content)
exportToDOCX(title, content)
exportToEPUB(title, content)

// 批量导出
await batchExport(documents, 'markdown')
```

### Plugin System

插件系统。

```typescript
import { pluginSystem } from '../services/pluginSystem'

// 注册插件
pluginSystem.register(plugin)

// 启用/禁用插件
pluginSystem.enable(pluginId)
pluginSystem.disable(pluginId)

// 卸载插件
pluginSystem.unregister(pluginId)
```

### Cloud Sync

云同步服务。

```typescript
import { cloudSyncService } from '../services/cloudSync'

// 测试连接
await cloudSyncService.testConnection(provider, config)

// 上传文档
await cloudSyncService.upload(docId, content, provider, config)

// 下载文档
const content = await cloudSyncService.download(docId, provider, config)
```

## Hook API

### useMobile

移动端检测 Hook。

```typescript
import { useMobile } from '../hooks/useMobile'

const {
  isMobile,
  isTablet,
  isDesktop,
  isTouchDevice,
  screenWidth,
  screenHeight,
  orientation,
} = useMobile()
```

### useKeyboardShortcuts

键盘快捷键 Hook。

```typescript
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

useKeyboardShortcuts({
  onSave: () => { /* ... */ },
  onSearch: () => { /* ... */ },
  // ...
})
```

### useAutoSave

自动保存 Hook。

```typescript
import { useAutoSave } from '../hooks/useAutoSave'

useAutoSave({
  documentId,
  content,
  enabled: true,
})
```

### useLazyImage

图片懒加载 Hook。

```typescript
import { useLazyImage } from '../hooks/useLazyImage'

const {
  imgRef,
  src,
  isLoaded,
  isInView,
} = useLazyImage({ src: 'image.jpg' })
```

### useTouchGesture

触摸手势 Hook。

```typescript
import { useTouchGesture } from '../hooks/useTouchGesture'

const { bind } = useTouchGesture({
  onSwipeLeft: () => { /* ... */ },
  onSwipeRight: () => { /* ... */ },
  onDoubleTap: () => { /* ... */ },
})
```

## 组件 API

### VirtualScroll

虚拟滚动组件。

```typescript
import { VirtualScroll } from '../components/VirtualScroll/VirtualScroll'

<VirtualScroll
  items={items}
  itemHeight={40}
  containerHeight={400}
  renderItem={(item, index) => <div>{item.name}</div>}
  onEndReached={() => loadMore()}
/>
```

### LazyImage

图片懒加载组件。

```typescript
import { LazyImage } from '../hooks/useLazyImage'

<LazyImage
  src="image.jpg"
  alt="描述"
  className="w-full h-auto"
/>
```

## 类型定义

### Document

```typescript
interface Document {
  id: string
  title: string
  type: 'chapter' | 'scene' | 'character' | 'code_snippet'
  content: object
  updatedAt: number
  parentId: string | null
  versions?: DocumentVersion[]
}
```

### DocumentVersion

```typescript
interface DocumentVersion {
  id: string
  content: object
  title: string
  createdAt: number
}
```

### AICommand

```typescript
type AICommand =
  | 'continue' | 'polish' | 'summarize' | 'expand'
  | 'simplify' | 'translateEn' | 'translateCn' | 'correct'
  | 'literary' | 'casual' | 'dialogue' | 'scene' | 'character'
  | 'plot' | 'title' | 'wordChoice' | 'rhythm' | 'sensory'
  | 'emotional' | 'formal' | 'suspense' | 'romance' | 'humor'
```

### ExportFormat

```typescript
type ExportFormat = 'markdown' | 'html' | 'pdf' | 'txt' | 'docx' | 'epub'
```

### Locale

```typescript
type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
```
