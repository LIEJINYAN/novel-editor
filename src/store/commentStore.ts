import { create } from 'zustand'

export interface Comment {
  id: string
  documentId: string
  author: string
  content: string
  selection?: string
  position?: { from: number; to: number }
  resolved: boolean
  createdAt: number
  updatedAt: number
  replies: CommentReply[]
}

export interface CommentReply {
  id: string
  author: string
  content: string
  createdAt: number
}

interface CommentState {
  comments: Comment[]
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'resolved'>) => string
  updateComment: (id: string, updates: Partial<Comment>) => void
  deleteComment: (id: string) => void
  resolveComment: (id: string) => void
  addReply: (commentId: string, reply: Omit<CommentReply, 'id' | 'createdAt'>) => void
  getDocumentComments: (documentId: string) => Comment[]
}

const STORAGE_KEY = 'novel-engine-comments'

function loadComments(): Comment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveComments(comments: Comment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments))
  } catch {}
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: loadComments(),

  addComment: (comment) => {
    const id = `comment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const newComment: Comment = {
      ...comment,
      id,
      resolved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replies: [],
    }
    set((state) => {
      const newComments = [...state.comments, newComment]
      saveComments(newComments)
      return { comments: newComments }
    })
    return id
  },

  updateComment: (id, updates) => {
    set((state) => {
      const newComments = state.comments.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
      )
      saveComments(newComments)
      return { comments: newComments }
    })
  },

  deleteComment: (id) => {
    set((state) => {
      const newComments = state.comments.filter((c) => c.id !== id)
      saveComments(newComments)
      return { comments: newComments }
    })
  },

  resolveComment: (id) => {
    set((state) => {
      const newComments = state.comments.map((c) =>
        c.id === id ? { ...c, resolved: !c.resolved, updatedAt: Date.now() } : c
      )
      saveComments(newComments)
      return { comments: newComments }
    })
  },

  addReply: (commentId, reply) => {
    const newReply: CommentReply = {
      ...reply,
      id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    }
    set((state) => {
      const newComments = state.comments.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, newReply], updatedAt: Date.now() } : c
      )
      saveComments(newComments)
      return { comments: newComments }
    })
  },

  getDocumentComments: (documentId) => {
    return get().comments.filter((c) => c.documentId === documentId)
  },
}))
