import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { novelExtensions, novelEditorProps } from '../editor/novelEditor'

describe('Tiptap Editor', () => {
  it('should create editor with novel extensions', () => {
    const editor = new Editor({
      extensions: novelExtensions,
      editorProps: novelEditorProps,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    })

    expect(editor).toBeDefined()
    expect(editor.isEditable).toBe(true)

    editor.destroy()
  })

  it('should support bold formatting', () => {
    const editor = new Editor({
      extensions: novelExtensions,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] },
    })

    editor.commands.selectAll()
    editor.commands.toggleBold()

    const html = editor.getHTML()
    expect(html).toContain('<strong>')

    editor.destroy()
  })

  it('should support heading levels', () => {
    const editor = new Editor({
      extensions: novelExtensions,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    })

    editor.commands.toggleHeading({ level: 1 })
    const html = editor.getHTML()
    expect(html).toContain('<h1>')

    editor.destroy()
  })

  it('should support list operations', () => {
    const editor = new Editor({
      extensions: novelExtensions,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    })

    editor.commands.toggleBulletList()
    let html = editor.getHTML()
    expect(html).toContain('<ul>')

    editor.commands.toggleOrderedList()
    html = editor.getHTML()
    expect(html).toContain('<ol>')

    editor.destroy()
  })

  it('should support undo/redo', () => {
    const editor = new Editor({
      extensions: novelExtensions,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    })

    editor.commands.insertContent('hello')
    const beforeUndo = editor.getText()
    expect(beforeUndo).toContain('hello')

    editor.commands.undo()
    const afterUndo = editor.getText()
    expect(afterUndo).not.toContain('hello')

    editor.destroy()
  })

  it('should support placeholder extension', () => {
    const editor = new Editor({
      extensions: novelExtensions,
      editorProps: novelEditorProps,
    })

    const editorElement = editor.view.dom
    expect(editorElement).toBeDefined()
    expect(editorElement.getAttribute('class')).toContain('prose')

    editor.destroy()
  })
})
