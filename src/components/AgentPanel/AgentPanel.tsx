import { useState, useRef, useEffect, useCallback } from 'react'
import { getAgent } from '../../services/agent'
import type { AgentState, AgentMessage } from '../../services/agent'
import { getAIConfig } from '../../services/aiService'
import { useDocumentStore } from '../../store/documentStore'
import { useTabStore } from '../../store/tabStore'
import { showError } from '../../utils/toast'
import { t } from '../../i18n'

interface Props {
  editorContent: string
  editorTitle: string
  editorDocId: string
  selection: string
  onInsertContent: (text: string) => void
  onReplaceContent: (text: string) => void
  onFormatText?: (format: string, value?: string) => void
  onFindInDocument?: (query: string, useRegex?: boolean, caseSensitive?: boolean) => void
  onReplaceInDocument?: (find: string, replace: string, replaceAll?: boolean) => void
  onCreateCodeBlock?: (language: string, code?: string) => void
  onUndo?: () => void
  onRedo?: () => void
}

interface ToolHistoryItem {
  id: string
  name: string
  args: any
  result?: string
  timestamp: number
  undone?: boolean
}

export default function AgentPanel({
  editorContent,
  editorTitle,
  editorDocId,
  selection,
  onInsertContent,
  onReplaceContent,
  onFormatText,
  onFindInDocument,
  onReplaceInDocument,
  onCreateCodeBlock,
  onUndo,
  onRedo,
}: Props) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState('')
  const [agentState, setAgentState] = useState<AgentState | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [toolHistory, setToolHistory] = useState<ToolHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; updatedAt: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [apiConfigured, setApiConfigured] = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)
  const [lastSentMessage, setLastSentMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const approveBtnRef = useRef<HTMLButtonElement>(null)

  const agent = getAgent()

  useEffect(() => {
    setApiConfigured(!!getAIConfig())
    void agent.init()
    agent.setCallbacks({
      onStateChange: (state) => {
        setAgentState(state)
        setMessages([...state.messages])
        setToolHistory(agent.getToolHistory())
      },
      onToolExecuted: (toolName, result) => {
        try {
          const parsed = JSON.parse(result)
          
          // Phase 1: 基础工具
          if (parsed.action === 'insert' && parsed.text) {
            onInsertContent(parsed.text)
          } else if (parsed.action === 'replace' && parsed.replacement) {
            onReplaceContent(parsed.replacement)
          } else if (parsed.action === 'suggest' && parsed.after) {
            onInsertContent(parsed.after)
          } else if (parsed.action === 'create' && parsed.title) {
            const content = parsed.content || { type: 'doc', content: [{ type: 'paragraph' }] }
            useDocumentStore.getState().addDoc({
              title: parsed.title,
              type: 'chapter',
              content,
              parentId: null,
            }).then((docId) => {
              useTabStore.getState().openTab(docId, parsed.title)
              useDocumentStore.getState().setCurrentDoc(docId)
            })
          }
          // Phase 1: 格式化工具
          else if (parsed.action === 'format' && parsed.format) {
            onFormatText?.(parsed.format, parsed.value)
          }
          // Phase 1: 搜索替换工具
          else if (parsed.action === 'replaceAll' && parsed.find !== undefined) {
            onReplaceInDocument?.(parsed.find, parsed.replace, parsed.replaceAll)
          }
          // Phase 1: 文档管理工具
          else if (parsed.action === 'delete' && parsed.docId) {
            useDocumentStore.getState().removeDoc(parsed.docId)
          } else if (parsed.action === 'rename' && parsed.docId && parsed.newTitle) {
            useDocumentStore.getState().updateDoc(parsed.docId, { title: parsed.newTitle })
            useTabStore.getState().updateTabTitle(parsed.docId, parsed.newTitle)
          } else if (parsed.action === 'move' && parsed.docId) {
            useDocumentStore.getState().moveDocToFolder(parsed.docId, parsed.folderId)
          } else if (parsed.action === 'createFolder' && parsed.name) {
            useDocumentStore.getState().addFolder(parsed.name, parsed.parentId)
          }
          // Phase 2: 标签页工具
          else if (parsed.action === 'openTab' && parsed.docId) {
            useTabStore.getState().openTab(parsed.docId, parsed.title)
          } else if (parsed.action === 'closeTab' && parsed.docId) {
            useTabStore.getState().closeTab(parsed.docId)
          } else if (parsed.action === 'switchTab' && parsed.docId) {
            useTabStore.getState().setActiveTab(parsed.docId)
          }
          // Phase 2: 撤销/重做工具
          else if (parsed.action === 'undo') {
            onUndo?.()
          } else if (parsed.action === 'redo') {
            onRedo?.()
          }
          // Phase 3: 代码块工具
          else if (parsed.action === 'createCodeBlock' && parsed.language) {
            onCreateCodeBlock?.(parsed.language, parsed.code)
          }
          // Phase 3: 版本工具
          else if (parsed.action === 'createVersion') {
            useDocumentStore.getState().createVersion(editorDocId)
          } else if (parsed.action === 'restoreVersion' && parsed.versionId) {
            useDocumentStore.getState().restoreVersion(editorDocId, parsed.versionId)
          }
          // Phase 4: 评论工具
          else if (parsed.action === 'addComment' && parsed.commentId) {
            // 评论已通过工具添加，无需额外操作
          }
          // Phase 4: 字数目标工具
          else if (parsed.action === 'setWordGoal' && parsed.type) {
            // 字数目标已通过工具设置，无需额外操作
          }
          // Phase 5: UI 控制工具
          else if (parsed.action === 'toggleTheme') {
            // 主题已通过工具切换，无需额外操作
          } else if (parsed.action === 'toggleWordWrap') {
            // 自动换行已通过工具切换，无需额外操作
          } else if (parsed.action === 'toggleSidebar') {
            // 侧边栏已通过工具切换，无需额外操作
          } else if (parsed.action === 'toggleFocusMode') {
            // 专注模式已通过工具切换，无需额外操作
          } else if (parsed.action === 'toggleAIPanel') {
            // AI面板已通过工具切换，无需额外操作
          }
          // Phase 7: 高级工具
          else if (parsed.action === 'exportDocument' && parsed.format) {
            // 导出由 App.tsx 处理
          } else if (parsed.action === 'batchExport' && parsed.format) {
            // 批量导出由 App.tsx 处理
          } else if (parsed.action === 'saveDocument') {
            // 保存已通过工具执行
          } else if (parsed.action === 'triggerShortcut') {
            // 快捷键已触发
          } else if (parsed.action === 'spellCheck') {
            // 拼写检查结果已返回
          }
          // Phase 8: 中级工具
          else if (parsed.action === 'updateMetadata') {
            // 元数据已更新
          } else if (parsed.action === 'editOutline') {
            // 大纲编辑由 App.tsx 处理
          } else if (parsed.action === 'editorToMarkdown') {
            // Markdown转换结果已返回
          } else if (parsed.action === 'markdownToEditor' && parsed.markdown) {
            onInsertContent?.(parsed.markdown)
          } else if (parsed.action === 'createBackup') {
            // 备份已创建
          } else if (parsed.action === 'restoreBackup') {
            // 备份已恢复
          } else if (parsed.action === 'validateDocument') {
            // 验证结果已返回
          }
          // Phase 9: 低级工具
          else if (parsed.action === 'showToast') {
            // Toast已显示
          } else if (parsed.action === 'preExportProcess') {
            // 预处理由 App.tsx 处理
          } else if (parsed.action === 'openPanel') {
            // 面板打开由 App.tsx 处理
          }
          // Phase 10: AI配置与云同步
          else if (parsed.action === 'getAIConfig') {
            // 配置已返回
          } else if (parsed.action === 'setAIConfig') {
            // 配置已设置
          } else if (parsed.action === 'clearAIConfig') {
            // 配置已清除
          } else if (parsed.action === 'getCloudConfig') {
            // 云配置已返回
          } else if (parsed.action === 'setCloudConfig') {
            // 云配置已设置
          } else if (parsed.action === 'testCloudConnection') {
            // 连接测试结果已返回
          } else if (parsed.action === 'triggerCloudSync') {
            // 同步已触发
          } else if (parsed.action === 'getQueueStatus') {
            // 队列状态已返回
          }
          // Phase 11: 崩溃恢复与插件
          else if (parsed.action === 'checkCrashRecovery') {
            // 崩溃恢复数据已检查
          } else if (parsed.action === 'clearCrashData') {
            // 崩溃数据已清除
          } else if (parsed.action === 'listPlugins') {
            // 插件列表已返回
          } else if (parsed.action === 'togglePlugin') {
            // 插件状态已切换
          }
          // Phase 12: 文件导入
          else if (parsed.action === 'importFile' && parsed.docId) {
            // 文件已导入
          }
          // Phase 13: UI控制补充
          else if (parsed.action === 'toggleTypewriterMode') {
            // 打字机模式已切换
          } else if (parsed.action === 'toggleFullscreen') {
            // 全屏模式已切换
          } else if (parsed.action === 'repairDocument') {
            // 文档已修复
          }
          // Phase 14: 协作操作
          else if (parsed.action === 'collaborationConnect') {
            // 协作连接已发送
          } else if (parsed.action === 'collaborationDisconnect') {
            // 协作已断开
          }
          // Phase 15: 快捷键管理
          else if (parsed.action === 'listShortcuts') {
            // 快捷键列表已返回
          } else if (parsed.action === 'updateShortcut') {
            // 快捷键已更新
          } else if (parsed.action === 'resetShortcut') {
            // 快捷键已重置
          } else if (parsed.action === 'findShortcutConflicts') {
            // 冲突检测结果已返回
          }
          // Phase 16: 文档会话与字数
          else if (parsed.action === 'getCursorPosition') {
            // 光标位置已返回
          } else if (parsed.action === 'getScrollPosition') {
            // 滚动位置已返回
          } else if (parsed.action === 'clearUndoHistory') {
            // 撤销历史已清除
          } else if (parsed.action === 'getTotalWordCount') {
            // 字数统计已返回
          }
          // Phase 17: 评论补充
          else if (parsed.action === 'resolveComment') {
            // 评论已解决
          } else if (parsed.action === 'deleteComment') {
            // 评论已删除
          } else if (parsed.action === 'addReply') {
            // 回复已添加
          }
          // Phase 18: UI/文件夹补充
          else if (parsed.action === 'setFocusToolbarMode') {
            // 工具栏模式已设置
          } else if (parsed.action === 'getUIState') {
            // UI状态已返回
          } else if (parsed.action === 'renameFolder') {
            // 文件夹已重命名
          } else if (parsed.action === 'removeFolder') {
            // 文件夹已删除
          }
          // Phase 19: 动态UI与交互
          else if (parsed.action === 'createDialog') {
            // 对话框已创建
          } else if (parsed.action === 'simulateClick') {
            // 点击已模拟
          }
        } catch {
          // Not all tool results are JSON actions
        }
      },
      onStreamChunk: (chunk) => {
        setStreamText((prev) => prev + chunk)
      },
    })
    loadConversationsList()
  }, [agent, onInsertContent, onReplaceContent, onFormatText, onReplaceInDocument, onCreateCodeBlock, onUndo, onRedo])

  const loadConversationsList = async () => {
    const list = await agent.loadConversationsList()
    setConversations(list.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt })))
  }

  useEffect(() => {
    agent.updateContext({
      documentContent: editorContent,
      documentTitle: editorTitle,
      documentId: editorDocId,
      selection,
    })
  }, [agent, editorContent, editorTitle, editorDocId, selection])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  useEffect(() => {
    if (agentState?.humanReviewRequired && approveBtnRef.current) {
      approveBtnRef.current.focus()
    }
  }, [agentState?.humanReviewRequired])

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming || !apiConfigured) return

    const userMessage = input.trim()
    setInput('')
    setStreaming(true)
    setStreamText('')
    setError(null)
    setLastSentMessage(userMessage)

    try {
      await agent.processMessage(userMessage)
    } catch (err) {
      setError((err as Error).message || t('agent.sendFailed'))
      console.error('Agent error:', err)
    } finally {
      setStreaming(false)
      setStreamText('')
    }
  }, [input, streaming, agent, apiConfigured])

  const handleRetry = useCallback(async () => {
    if (!lastSentMessage || streaming) return
    setStreaming(true)
    setStreamText('')
    setError(null)

    try {
      await agent.processMessage(lastSentMessage)
    } catch (err) {
      setError((err as Error).message || t('agent.retryFailed'))
      console.error('Agent retry error:', err)
    } finally {
      setStreaming(false)
      setStreamText('')
    }
  }, [lastSentMessage, streaming, agent])

  const handleApprove = useCallback(async () => {
    setStreaming(true)
    try {
      await agent.approvePendingTools()
    } catch (err) {
      setError((err as Error).message || t('agent.approveFailed'))
      console.error('Approve error:', err)
    } finally {
      setStreaming(false)
    }
  }, [agent])

  const handleReject = useCallback(() => {
    agent.rejectPendingTools(t('agent.operationCancelled'))
  }, [agent])

  const handleStop = useCallback(() => {
    agent.rejectPendingTools(t('agent.operationCancelled'))
    setStreaming(false)
    setStreamText('')
  }, [agent])

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(() => {})
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (agentState?.humanReviewRequired) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleApprove()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleReject()
        }
        return
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      } else if (e.key === 'Escape' && streaming) {
        e.preventDefault()
        handleStop()
      }
    },
    [handleSend, handleApprove, handleReject, handleStop, streaming, agentState?.humanReviewRequired]
  )

  const handleClearHistory = useCallback(() => {
    if (confirmClear) {
      agent.clearHistory()
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
    }
  }, [agent, confirmClear])

  const handleNewConversation = useCallback(() => {
    agent.clearHistory()
    setMessages([])
    setToolHistory([])
    setConfirmClear(false)
  }, [agent])

  const QUICK_ACTIONS = [
    { label: t('agent.quickActions.continue'), prompt: t('agent.quickPrompts.continue') },
    { label: t('agent.quickActions.polish'), prompt: t('agent.quickPrompts.polish') },
    { label: t('agent.quickActions.summarize'), prompt: t('agent.quickPrompts.summarize') },
    { label: t('agent.quickActions.expand'), prompt: t('agent.quickPrompts.expand') },
    { label: t('agent.quickActions.translate'), prompt: t('agent.quickPrompts.translate') },
    { label: t('agent.quickActions.correct'), prompt: t('agent.quickPrompts.correct') },
    { label: t('agent.quickActions.bold'), prompt: t('agent.quickPrompts.bold') },
    { label: t('agent.quickActions.heading'), prompt: t('agent.quickPrompts.heading') },
    { label: t('agent.quickActions.search'), prompt: t('agent.quickPrompts.search') },
    { label: t('agent.quickActions.stats'), prompt: t('agent.quickPrompts.stats') },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0" role="complementary" aria-label="AI Agent">
      <div className="p-3 border-b border-editor-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-editor-muted uppercase tracking-wider">
            AI Agent
          </h2>
          {agentState?.humanReviewRequired && (
            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded" role="status">
              {t('agent.pendingReview')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewConversation}
            className="text-[10px] text-editor-muted hover:text-editor-text px-1.5 py-0.5 rounded hover:bg-editor-surface"
            aria-label={t('agent.newChat')}
            title={t('agent.newChat')}
          >
            +
          </button>
          <button
            onClick={async () => {
              const result = await agent.undoLastTool()
              if (result.success && result.undoAction) {
                if (result.undoAction.type === 'delete') {
                  onReplaceContent('')
                } else if (result.undoAction.type === 'replace') {
                  onReplaceContent(result.undoAction.data.text)
                }
              } else {
                showError(t('agent.noUndo'))
              }
            }}
            disabled={!agent.canUndo()}
            className="text-[10px] text-editor-muted hover:text-editor-text disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('agent.undoLast')}
            title={t('agent.undoLast')}
          >
            ↩
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`text-[10px] ${showHistory ? 'text-editor-accent' : 'text-editor-muted hover:text-editor-text'}`}
            aria-label={t('agent.toolHistory')}
            title={t('agent.toolHistory')}
          >
            📋 {toolHistory.length > 0 && <span>({toolHistory.length})</span>}
          </button>
          <button
            onClick={handleClearHistory}
            className={`text-[10px] ${confirmClear ? 'text-red-500' : 'text-editor-muted hover:text-editor-text'}`}
            aria-label={confirmClear ? t('agent.confirmClear') : t('agent.clearChat')}
            title={confirmClear ? t('agent.confirmClear') : t('agent.clearChat')}
          >
            {confirmClear ? t('agent.confirmClear') : t('agent.clear')}
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="border-b border-editor-border p-2 max-h-40 overflow-y-auto">
          <p className="text-[10px] text-editor-muted mb-1">{t('agent.toolCallHistory')}</p>
          {toolHistory.length === 0 ? (
            <p className="text-[10px] text-editor-muted/50">{t('agent.noRecords')}</p>
          ) : (
            <div className="space-y-1">
              {toolHistory.slice().reverse().map((item) => (
                <div
                  key={item.id}
                  className={`text-[10px] p-1.5 rounded ${item.undone ? 'bg-red-500/10 text-red-500 line-through' : 'bg-editor-bg text-editor-text'}`}
                >
                  <span className="font-medium">{item.name}</span>
                  {item.result && (
                    <span className="ml-1 text-editor-muted">→ {item.result.slice(0, 50)}{item.result.length > 50 ? '...' : ''}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {conversations.length > 0 && (
        <div className="border-b border-editor-border p-2">
          <p className="text-[10px] text-editor-muted mb-1">{t('agent.historyConversations')}</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {conversations.slice(0, 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() => agent.loadConversation(conv.id)}
                className="w-full text-left text-[10px] text-editor-text hover:bg-editor-bg p-1 rounded truncate"
              >
                {conv.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3" role="log" aria-live="polite" aria-label={t('agent.title')}>
        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-500 flex items-center justify-between" role="alert">
            <span>❌ {error}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRetry}
                className="text-red-500 hover:text-red-600 text-[10px] underline"
              >
                {t('agent.retry')}
              </button>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-600"
                aria-label={t('agent.closeError')}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {!apiConfigured && messages.length === 0 && (
          <div className="text-center text-editor-muted text-xs py-8">
            <p className="mb-2">⚠️ {t('agent.configureAPI')}</p>
            <p className="text-[10px]">{t('agent.configureAPIDetail')}</p>
          </div>
        )}

        {apiConfigured && messages.length === 0 && (
          <div className="text-center text-editor-muted text-xs py-8">
            <p className="mb-2">🤖 {t('agent.ready')}</p>
            <p className="text-[10px]">{t('agent.readyDetail')}</p>
          </div>
        )}

        {messages
          .filter((m) => m.role !== 'system')
          .map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                  msg.role === 'user'
                    ? 'bg-editor-accent text-editor-bg'
                    : 'bg-editor-bg text-editor-text'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'assistant' && msg.content && (
                  <button
                    onClick={() => handleCopyMessage(msg.content)}
                    className="text-[10px] text-editor-muted mt-1 hover:text-editor-accent ml-1"
                    aria-label={t('agent.copy')}
                   >
                     {t('agent.copy')}
                  </button>
                )}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-editor-border/30">
                    {msg.toolCalls.map((tc, j) => (
                      <div key={j} className="inline-flex items-center text-[10px] bg-editor-accent/20 rounded px-1.5 py-0.5 mr-1 mb-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                        <span className="font-medium">{tc.name}</span>
                        {tc.args && Object.keys(tc.args).length > 0 && (
                          <span className="ml-1 text-editor-muted">
                            ({Object.entries(tc.args).map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`).join(', ')})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

        {streaming && (
          <div className="flex justify-start" aria-live="polite">
            <div className="rounded-lg px-3 py-2 text-xs bg-editor-bg text-editor-muted">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-editor-accent rounded-full animate-pulse" />
                <span className="text-[10px]">
                  {agentState?.currentStep === 'execute' && t('agent.executingTool')}
                   {agentState?.currentStep === 'respond' && t('agent.generatingReply')}
                   {agentState?.currentStep === 'idle' && t('agent.processing')}
                </span>
              </div>
              {streamText && (
                <p className="whitespace-pre-wrap text-editor-text mt-1">{streamText}</p>
              )}
              {!streamText && (
                <span className="flex gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-editor-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-editor-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-editor-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {agentState?.humanReviewRequired && (
        <div className="mx-3 mb-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg" role="alertdialog" aria-label={t('agent.confirmOperation')}>
           <p className="text-xs text-yellow-500 mb-2">⚠️ {t('agent.confirmOperation')}</p>
          <div className="text-[10px] text-editor-muted mb-2 max-h-20 overflow-y-auto">
            {agentState.humanReviewData?.map((tc: any, i: number) => (
              <div key={i}>
                <span className="font-medium">{tc.name}</span>
                {tc.args?.description && `: ${tc.args.description}`}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-editor-muted mb-2">{t('agent.approveHint')}</p>
          <div className="flex gap-2">
            <button
              ref={approveBtnRef}
              onClick={handleApprove}
              className="flex-1 px-2 py-1 text-[10px] bg-green-500 text-white rounded hover:bg-green-600"
            >
               ✓ {t('agent.approve')}
            </button>
            <button
              onClick={handleReject}
              className="flex-1 px-2 py-1 text-[10px] bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
            >
               ✕ {t('agent.reject')}
            </button>
          </div>
        </div>
      )}

      <div className="px-3 pb-2 flex gap-1 flex-wrap">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              if (input && input !== action.prompt) {
                if (!confirm(t('agent.confirmReplace', { label: action.label }))) return
              }
              setInput(action.prompt)
              inputRef.current?.focus()
            }}
            className="px-2 py-0.5 text-[10px] bg-editor-bg border border-editor-border rounded hover:border-editor-accent text-editor-muted hover:text-editor-text transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-editor-border">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
             placeholder={!apiConfigured ? t('agent.configureAPIPlaceholder') : streaming ? t('agent.streamingPlaceholder') : t('agent.inputPlaceholder')}
            className="flex-1 bg-editor-bg text-editor-text text-xs px-3 py-2 rounded border border-editor-border outline-none resize-none placeholder:text-editor-muted"
            rows={2}
            disabled={streaming}
             aria-label={t('agent.inputCommand')}
          />
          {streaming ? (
            <button
              onClick={handleStop}
              className="px-3 py-2 bg-red-500/20 text-red-500 text-xs rounded hover:bg-red-500/30"
               aria-label={t('agent.stopGeneration')}
            >
              ■
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming || !apiConfigured}
              className="px-3 py-2 bg-editor-accent text-editor-bg text-xs rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
               aria-label={t('agent.sendMessage')}
            >
              →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
