import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import MonacoView from './MonacoView'

export interface MonacoCodeBlockOptions {
  languages: string[]
  theme: string
  defaultLanguage: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    monacoCodeBlock: {
      setMonacoCodeBlock: (attrs?: { language?: string; code?: string }) => ReturnType
    }
  }
}

export const MonacoCodeBlockExtension = Node.create<MonacoCodeBlockOptions>({
  name: 'monacoCodeBlock',

  group: 'block',

  atom: true,

  defining: true,

  addOptions() {
    return {
      languages: ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 'xml', 'yaml', 'lua'],
      theme: 'vs-dark',
      defaultLanguage: 'plaintext',
    }
  },

  addAttributes() {
    return {
      language: {
        default: this.options.defaultLanguage,
        parseHTML: (element) => element.getAttribute('data-language') || this.options.defaultLanguage,
        renderHTML: (attributes) => ({ 'data-language': attributes.language }),
      },
      code: {
        default: '',
        parseHTML: (element) => element.textContent || '',
        renderHTML: (attributes) => attributes.code,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'pre[data-type="monaco-code-block"]',
        getAttrs: (dom) => {
          const el = dom as HTMLElement
          return {
            language: el.getAttribute('data-language') || this.options.defaultLanguage,
            code: el.textContent || '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['pre', { 'data-type': 'monaco-code-block', 'data-language': HTMLAttributes.language }, HTMLAttributes.code]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MonacoView)
  },

  addCommands() {
    return {
      setMonacoCodeBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attrs || { language: this.options.defaultLanguage, code: '' },
          })
        },
    }
  },
})
