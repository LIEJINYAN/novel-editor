import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentSessionStore } from '../store/documentSessionStore'

describe('useDocumentSessionStore', () => {
  beforeEach(() => {
    useDocumentSessionStore.setState({ sessions: {} })
  })

  it('should have empty sessions by default', () => {
    const state = useDocumentSessionStore.getState()
    expect(state.sessions).toEqual({})
  })

  describe('createSession', () => {
    it('should create a session with default values', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      const session = useDocumentSessionStore.getState().sessions['doc1']
      expect(session).toBeDefined()
      expect(session.docId).toBe('doc1')
      expect(session.undoStack).toEqual([])
      expect(session.redoStack).toEqual([])
      expect(session.cursorPosition).toBeNull()
      expect(session.scrollPosition).toBe(0)
      expect(session.lastModified).toBeTypeOf('number')
    })
  })

  describe('removeSession', () => {
    it('should remove a session', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      expect(useDocumentSessionStore.getState().sessions['doc1']).toBeDefined()
      useDocumentSessionStore.getState().removeSession('doc1')
      expect(useDocumentSessionStore.getState().sessions['doc1']).toBeUndefined()
    })
  })

  describe('pushUndo', () => {
    it('should push to undoStack and clear redoStack', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      const content = { text: 'hello' }
      useDocumentSessionStore.getState().pushUndo('doc1', content)
      const session = useDocumentSessionStore.getState().sessions['doc1']
      expect(session.undoStack).toHaveLength(1)
      expect(session.undoStack[0]).toEqual(content)
      expect(session.redoStack).toEqual([])
    })

    it('should deep copy content', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      const content = { text: 'hello', nested: { a: 1 } }
      useDocumentSessionStore.getState().pushUndo('doc1', content)
      const session = useDocumentSessionStore.getState().sessions['doc1']
      expect(session.undoStack[0]).toEqual(content)
      expect(session.undoStack[0]).not.toBe(content)
      expect((session.undoStack[0] as any).nested).not.toBe((content as any).nested)
    })

    it('should remove oldest entry when exceeding MAX_UNDO_STACK (100)', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      for (let i = 0; i < 101; i++) {
        useDocumentSessionStore.getState().pushUndo('doc1', { index: i })
      }
      const session = useDocumentSessionStore.getState().sessions['doc1']
      expect(session.undoStack).toHaveLength(100)
      expect(session.undoStack[0]).toEqual({ index: 1 })
      expect(session.undoStack[99]).toEqual({ index: 100 })
    })
  })

  describe('undo', () => {
    it('should pop from undoStack, push to redoStack, and return content', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      useDocumentSessionStore.getState().pushUndo('doc1', { v: 1 })
      useDocumentSessionStore.getState().pushUndo('doc1', { v: 2 })

      const result = useDocumentSessionStore.getState().undo('doc1')
      expect(result).toEqual({ v: 2 })
      const session = useDocumentSessionStore.getState().sessions['doc1']
      expect(session.undoStack).toHaveLength(1)
      expect(session.redoStack).toHaveLength(1)
      expect(session.redoStack[0]).toEqual({ v: 2 })
    })

    it('should return null when undoStack is empty', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      const result = useDocumentSessionStore.getState().undo('doc1')
      expect(result).toBeNull()
    })

    it('should return null when session does not exist', () => {
      const result = useDocumentSessionStore.getState().undo('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('redo', () => {
    it('should pop from redoStack, push to undoStack, and return content', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      useDocumentSessionStore.getState().pushUndo('doc1', { v: 1 })
      useDocumentSessionStore.getState().undo('doc1')

      const result = useDocumentSessionStore.getState().redo('doc1')
      expect(result).toEqual({ v: 1 })
      const session = useDocumentSessionStore.getState().sessions['doc1']
      expect(session.redoStack).toHaveLength(0)
      expect(session.undoStack).toHaveLength(1)
    })

    it('should return null when redoStack is empty', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      const result = useDocumentSessionStore.getState().redo('doc1')
      expect(result).toBeNull()
    })
  })

  describe('canUndo / canRedo', () => {
    it('should return false when session does not exist', () => {
      expect(useDocumentSessionStore.getState().canUndo('nonexistent')).toBe(false)
      expect(useDocumentSessionStore.getState().canRedo('nonexistent')).toBe(false)
    })

    it('canUndo returns true when undoStack is non-empty', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      expect(useDocumentSessionStore.getState().canUndo('doc1')).toBe(false)
      useDocumentSessionStore.getState().pushUndo('doc1', { v: 1 })
      expect(useDocumentSessionStore.getState().canUndo('doc1')).toBe(true)
    })

    it('canRedo returns true when redoStack is non-empty', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      useDocumentSessionStore.getState().pushUndo('doc1', { v: 1 })
      expect(useDocumentSessionStore.getState().canRedo('doc1')).toBe(false)
      useDocumentSessionStore.getState().undo('doc1')
      expect(useDocumentSessionStore.getState().canRedo('doc1')).toBe(true)
    })
  })

  describe('clearHistory', () => {
    it('should empty both stacks', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      useDocumentSessionStore.getState().pushUndo('doc1', { v: 1 })
      useDocumentSessionStore.getState().pushUndo('doc1', { v: 2 })
      useDocumentSessionStore.getState().undo('doc1')
      useDocumentSessionStore.getState().clearHistory('doc1')
      const session = useDocumentSessionStore.getState().sessions['doc1']
      expect(session.undoStack).toEqual([])
      expect(session.redoStack).toEqual([])
    })
  })

  describe('setCursorPosition / getCursorPosition', () => {
    it('should store and retrieve cursor position', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      useDocumentSessionStore.getState().setCursorPosition('doc1', 42)
      expect(useDocumentSessionStore.getState().getCursorPosition('doc1')).toBe(42)
    })

    it('should return null for nonexistent session', () => {
      expect(useDocumentSessionStore.getState().getCursorPosition('nonexistent')).toBeNull()
    })
  })

  describe('setScrollPosition / getScrollPosition', () => {
    it('should store and retrieve scroll position', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      useDocumentSessionStore.getState().setScrollPosition('doc1', 500)
      expect(useDocumentSessionStore.getState().getScrollPosition('doc1')).toBe(500)
    })

    it('should return 0 for nonexistent session', () => {
      expect(useDocumentSessionStore.getState().getScrollPosition('nonexistent')).toBe(0)
    })
  })

  describe('getSession', () => {
    it('should return session or undefined', () => {
      useDocumentSessionStore.getState().createSession('doc1')
      expect(useDocumentSessionStore.getState().getSession('doc1')).toBeDefined()
      expect(useDocumentSessionStore.getState().getSession('nonexistent')).toBeUndefined()
    })
  })
})
