import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    multiCursor: {
      addCursorAt: (position: number) => ReturnType
      selectAllCursors: () => ReturnType
      removeSecondaryCursors: () => ReturnType
    }
  }
}

export interface MultiCursorOptions {
  maxCursors: number
}

export const MultiCursor = Extension.create<MultiCursorOptions>({
  name: 'multiCursor',

  addOptions() {
    return {
      maxCursors: 5,
    }
  },

  addCommands() {
    return {
      addCursorAt:
        (position: number) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            // 设置新的选区位置
            tr.setSelection({
              type: 'text',
              anchor: position,
              head: position,
            } as any)
          }
          return true
        },

      selectAllCursors:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            // 选择所有内容
            const { doc } = tr
            tr.setSelection({
              type: 'text',
              anchor: 0,
              head: doc.content.size,
            } as any)
          }
          return true
        },

      removeSecondaryCursors:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            // 保留主选区
            const { selection } = tr
            tr.setSelection(selection)
          }
          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-L': () => this.editor.commands.selectAllCursors(),
      'Escape': () => this.editor.commands.removeSecondaryCursors(),
    }
  },
})
