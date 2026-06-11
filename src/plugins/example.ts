import type { Editor } from '@tiptap/core'

interface Plugin {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  onLoad?: () => void | Promise<void>
  onUnload?: () => void | Promise<void>
  onEditorReady?: (editor: Editor) => void
  commands?: Array<{
    id: string
    label: string
    icon?: string
    action: (editor: Editor) => void
  }>
  toolbarButtons?: Array<{
    id: string
    icon: string
    label: string
    action: (editor: Editor) => void
  }>
}

export const examplePlugin: Plugin = {
  id: 'example-plugin',
  name: '示例插件',
  version: '1.0.0',
  description: '一个展示插件功能的示例插件',
  author: 'NovelEngine',

  onLoad() {
    // Plugin loaded
  },

  onUnload() {
    // Plugin unloaded
  },

  onEditorReady(_editor: Editor) {
    // Editor ready
  },

  commands: [
    {
      id: 'example-insert-time',
      label: '插入当前时间',
      icon: '🕐',
      action: (editor: Editor) => {
        const time = new Date().toLocaleTimeString('zh-CN')
        editor.chain().focus().insertContent(`[${time}]`).run()
      },
    },
    {
      id: 'example-convert-to-uppercase',
      label: '转换为大写',
      icon: '🔠',
      action: (editor: Editor) => {
        const { from, to } = editor.state.selection
        const text = editor.state.doc.textBetween(from, to, '')
        if (text) {
          editor.chain().focus().deleteSelection().insertContent(text.toUpperCase()).run()
        }
      },
    },
    {
      id: 'example-add-todo',
      label: '添加待办事项',
      icon: '☑️',
      action: (editor: Editor) => {
        editor.chain().focus().insertContent('- [ ] 待办事项').run()
      },
    },
  ],

  toolbarButtons: [
    {
      id: 'example-btn-time',
      icon: '🕐',
      label: '插入时间',
      action: (editor: Editor) => {
        const time = new Date().toLocaleTimeString('zh-CN')
        editor.chain().focus().insertContent(`[${time}]`).run()
      },
    },
  ],
}

export default examplePlugin
