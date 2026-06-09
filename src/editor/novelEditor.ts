import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import CharacterCount from '@tiptap/extension-character-count'
import { MonacoCodeBlockExtension } from '../extensions/monacoCodeBlock'

export const novelExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false,
  }),
  Underline,
  MonacoCodeBlockExtension,
  Placeholder.configure({
    placeholder: '开始写作...',
  }),
  Typography,
  Highlight,
  CharacterCount,
]

export const getNovelEditorProps = (wordWrap: boolean = true) => ({
  attributes: {
    class: `prose prose-invert max-w-none focus:outline-none min-h-full px-8 py-6 ${wordWrap ? 'word-wrap-enabled' : 'word-wrap-disabled'}`,
  },
})

export const novelEditorProps = getNovelEditorProps()

export const defaultContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '欢迎使用小说引擎编辑器！' }],
    },
  ],
}
