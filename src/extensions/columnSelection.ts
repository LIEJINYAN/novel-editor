import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columnSelection: {
      selectColumn: (columnIndex: number) => ReturnType
      selectBlock: (blockIndex: number) => ReturnType
    }
  }
}

export interface ColumnSelectionOptions {
  enabled: boolean
}

export const ColumnSelection = Extension.create<ColumnSelectionOptions>({
  name: 'columnSelection',

  addOptions() {
    return {
      enabled: true,
    }
  },

  addCommands() {
    return {
      selectColumn:
        (columnIndex: number) =>
        ({ tr, state, dispatch }) => {
          if (!this.options.enabled) return false

          if (dispatch) {
            const { doc } = state
            const positions: number[] = []

            doc.descendants((node, pos) => {
              if (node.isBlock) {
                const text = node.textContent
                if (text.length > columnIndex) {
                  // 计算列位置
                  let charCount = 0
                  node.descendants((child) => {
                    if (child.isText) {
                      if (charCount + (child.text?.length || 0) > columnIndex) {
                        positions.push(pos + charCount + (columnIndex - charCount))
                      }
                      charCount += child.text?.length || 0
                    }
                  })
                }
              }
            })

            if (positions.length > 0) {
              // 创建多选区
              const selection = {
                type: 'text' as const,
                anchor: positions[0],
                head: positions[positions.length - 1],
              }
              tr.setSelection(selection as any)
            }
          }
          return true
        },

      selectBlock:
        (blockIndex: number) =>
        ({ tr, state, dispatch }) => {
          if (!this.options.enabled) return false

          if (dispatch) {
            const { doc } = state
            let currentBlock = 0

            doc.descendants((node, pos) => {
              if (node.isBlock && currentBlock === blockIndex) {
                const from = pos
                const to = pos + node.nodeSize

                const selection = {
                  type: 'text' as const,
                  anchor: from,
                  head: to,
                }
                tr.setSelection(selection as any)
                return false
              }
              if (node.isBlock) {
                currentBlock++
              }
            })
          }
          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Alt-Shift-ArrowUp': () => {
        // 列选择：向上扩展选区
        const { state } = this.editor
        const { from } = state.selection
        return this.editor.commands.addCursorAt(from - 1)
      },
      'Alt-Shift-ArrowDown': () => {
        // 列选择：向下扩展选区
        const { state } = this.editor
        const { from } = state.selection
        return this.editor.commands.addCursorAt(from + 1)
      },
    }
  },
})
