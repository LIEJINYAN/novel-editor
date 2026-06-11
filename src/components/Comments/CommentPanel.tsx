import { useState } from 'react'
import { useCommentStore, type Comment } from '../../store/commentStore'
import Modal from '../common/Modal'

interface Props {
  documentId: string
  onClose: () => void
}

export default function CommentPanel({ documentId, onClose }: Props) {
  const { getDocumentComments, addComment, resolveComment, deleteComment, addReply } = useCommentStore()
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showResolved, setShowResolved] = useState(false)

  const comments = getDocumentComments(documentId).filter((c) =>
    showResolved ? true : !c.resolved
  )

  const handleAddComment = () => {
    if (!newComment.trim()) return

    addComment({
      documentId,
      author: '用户',
      content: newComment.trim(),
    })
    setNewComment('')
  }

  const handleAddReply = (commentId: string) => {
    if (!replyContent.trim()) return

    addReply(commentId, {
      author: '用户',
      content: replyContent.trim(),
    })
    setReplyContent('')
    setReplyTo(null)
  }

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <Modal open={true} onClose={onClose} title="💬 评论与批注" size="md">
      <div className="flex flex-col h-[60vh]">
        <div className="p-3 border-b border-editor-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="添加评论..."
              className="flex-1 bg-editor-bg text-editor-text text-xs px-3 py-2 rounded border border-editor-border outline-none"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-3 py-2 bg-editor-accent text-editor-bg text-xs rounded hover:opacity-90 disabled:opacity-50"
            >
              添加
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="flex items-center gap-1 text-[10px] text-editor-muted">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded"
              />
              显示已解决
            </label>
            <span className="text-[10px] text-editor-muted">
              {comments.length} 条评论
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {comments.length === 0 ? (
            <div className="text-center text-editor-muted text-xs py-8">
              暂无评论
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replyTo={replyTo}
                replyContent={replyContent}
                onReplyTo={setReplyTo}
                onReplyContentChange={setReplyContent}
                onAddReply={handleAddReply}
                onResolve={resolveComment}
                onDelete={deleteComment}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

interface CommentItemProps {
  comment: Comment
  replyTo: string | null
  replyContent: string
  onReplyTo: (id: string | null) => void
  onReplyContentChange: (content: string) => void
  onAddReply: (commentId: string) => void
  onResolve: (id: string) => void
  onDelete: (id: string) => void
  formatDate: (timestamp: number) => string
}

function CommentItem({
  comment,
  replyTo,
  replyContent,
  onReplyTo,
  onReplyContentChange,
  onAddReply,
  onResolve,
  onDelete,
  formatDate,
}: CommentItemProps) {
  return (
    <div className={`p-3 rounded-lg border ${comment.resolved ? 'bg-editor-bg/50 opacity-60' : 'bg-editor-bg'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-editor-accent">{comment.author}</span>
            <span className="text-[10px] text-editor-muted">{formatDate(comment.createdAt)}</span>
            {comment.resolved && (
              <span className="text-[10px] text-green-500 bg-green-500/10 px-1 rounded">已解决</span>
            )}
          </div>
          <p className="text-xs text-editor-text whitespace-pre-wrap">{comment.content}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onResolve(comment.id)}
            className="text-[10px] text-editor-muted hover:text-green-500"
            title={comment.resolved ? '重新打开' : '标记为已解决'}
          >
            {comment.resolved ? '🔄' : '✓'}
          </button>
          <button
            onClick={() => onDelete(comment.id)}
            className="text-[10px] text-editor-muted hover:text-red-500"
            title="删除"
          >
            ×
          </button>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-2 pt-2 border-t border-editor-border space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="pl-3 border-l-2 border-editor-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium text-editor-accent">{reply.author}</span>
                <span className="text-[10px] text-editor-muted">{formatDate(reply.createdAt)}</span>
              </div>
              <p className="text-[10px] text-editor-text">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {replyTo === comment.id ? (
        <div className="mt-2 pt-2 border-t border-editor-border flex gap-2">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => onReplyContentChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddReply(comment.id)}
            placeholder="回复..."
            className="flex-1 bg-editor-surface text-editor-text text-[10px] px-2 py-1 rounded border border-editor-border outline-none"
            autoFocus
          />
          <button
            onClick={() => onAddReply(comment.id)}
            disabled={!replyContent.trim()}
            className="px-2 py-1 bg-editor-accent text-editor-bg text-[10px] rounded hover:opacity-90 disabled:opacity-50"
          >
            回复
          </button>
          <button
            onClick={() => onReplyTo(null)}
            className="px-2 py-1 text-[10px] text-editor-muted hover:text-editor-text"
          >
            取消
          </button>
        </div>
      ) : (
        <button
          onClick={() => onReplyTo(comment.id)}
          className="mt-2 text-[10px] text-editor-muted hover:text-editor-accent"
        >
          回复
        </button>
      )}
    </div>
  )
}
