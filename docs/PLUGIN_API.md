# NovelEngine Plugin API 文档

## 概述

NovelEngine 支持通过插件系统扩展功能。插件可以：
- 注册自定义扩展
- 添加命令
- 注入工具栏按钮
- 监听编辑器事件

## 插件接口

```typescript
interface Plugin {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  
  // 生命周期
  onLoad?: () => void | Promise<void>
  onUnload?: () => void | Promise<void>
  
  // 扩展
  extensions?: any[]
  commands?: Command[]
  toolbarButtons?: ToolbarButton[]
  
  // 事件
  onEditorReady?: (editor: Editor) => void
  onContentChange?: (content: object) => void
}
```

## 注册插件

```typescript
import { usePluginStore } from './store/pluginStore'

const myPlugin: Plugin = {
  id: 'my-plugin',
  name: '我的插件',
  version: '1.0.0',
  
  onLoad() {
    console.log('插件已加载')
  },
  
  onUnload() {
    console.log('插件已卸载')
  },
}

usePluginStore.getState().registerPlugin(myPlugin)
```

## 添加命令

```typescript
interface Command {
  id: string
  label: string
  icon?: string
  action: (editor: Editor) => void
}

const myPlugin: Plugin = {
  // ...
  commands: [
    {
      id: 'my-command',
      label: '我的命令',
      icon: '⚡',
      action: (editor) => {
        editor.chain().focus().insertContent('Hello!').run()
      },
    },
  ],
}
```

## 添加工具栏按钮

```typescript
interface ToolbarButton {
  id: string
  icon: string
  label: string
  action: (editor: Editor) => void
  isActive?: (editor: Editor) => boolean
}

const myPlugin: Plugin = {
  // ...
  toolbarButtons: [
    {
      id: 'my-button',
      icon: '🔧',
      label: '我的按钮',
      action: (editor) => {
        // 执行操作
      },
    },
  ],
}
```

## 使用扩展

```typescript
import StarterKit from '@tiptap/starter-kit'

const myPlugin: Plugin = {
  // ...
  extensions: [
    StarterKit.configure({
      // 配置
    }),
  ],
}
```

## 示例插件

### 字数统计插件

```typescript
const wordCountPlugin: Plugin = {
  id: 'word-count',
  name: '字数统计',
  version: '1.0.0',
  
  onEditorReady(editor) {
    const updateCount = () => {
      const text = editor.getText()
      const count = text.split(/\s+/).filter(Boolean).length
      console.log(`字数: ${count}`)
    }
    
    editor.on('update', updateCount)
    updateCount()
  },
}
```

### 自动保存插件

```typescript
const autoSavePlugin: Plugin = {
  id: 'auto-save',
  name: '自动保存',
  version: '1.0.0',
  
  onEditorReady(editor) {
    let timeout: ReturnType<typeof setTimeout>
    
    editor.on('update', () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const content = editor.getJSON()
        localStorage.setItem('draft', JSON.stringify(content))
        console.log('已自动保存')
      }, 1000)
    })
  },
}
```

## 最佳实践

1. **唯一ID**: 确保插件ID全局唯一
2. **清理资源**: 在 `onUnload` 中清理所有订阅和定时器
3. **错误处理**: 包装可能失败的操作
4. **性能**: 避免在每次按键时执行昂贵操作
5. **兼容性**: 检查编辑器版本兼容性
