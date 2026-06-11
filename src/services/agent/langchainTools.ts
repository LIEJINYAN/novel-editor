import { DynamicTool } from '@langchain/core/tools'
import { useDocumentStore } from '../../store/documentStore'
import { useTabStore } from '../../store/tabStore'
import { useCommentStore } from '../../store/commentStore'
import { useWritingStatsStore } from '../../store/writingStatsStore'
import { useWordGoalStore } from '../../store/wordGoalStore'
import { useThemeStore } from '../../store/themeStore'
import { useUIStore } from '../../store/uiStore'
import { useCollaborationStore } from '../../store/collaborationStore'
import { useAutoSaveStore } from '../../store/autoSaveStore'
import { useHighContrastStore } from '../../store/highContrastStore'
import { useCustomThemeStore } from '../../store/customThemeStore'
import { useDocumentCacheStore } from '../../store/documentCacheStore'
import { useShortcutStore } from '../../store/shortcutStore'
import { useDocumentSessionStore } from '../../store/documentSessionStore'
import { useWordCountStore } from '../../store/wordCountStore'
import { tiptapToMarkdown } from '../../utils/export'
import { createBackup, getBackups, restoreBackup } from '../../services/backupService'
import { validateDocument, repairDocument } from '../../services/validationService'
import { showToast, showSuccess, showError, showWarning } from '../../utils/toast'
import { getAIConfig, saveAIConfig, clearAIConfig } from '../../services/aiService'
import { getCloudConfig, saveCloudConfig, clearCloudConfig, testConnection, syncToCloud, getSyncStatus } from '../../services/cloudSync'
import { getCrashRecoveryData, saveCrashRecoveryData, clearCrashRecoveryData, hasCrashRecoveryData } from '../../services/crashRecovery'
import { getAllPlugins, enablePlugin, disablePlugin, getPlugin } from '../../services/pluginSystem'
import { importFile } from '../../utils/importFile'

export interface ToolContext {
  documentContent: string
  documentTitle: string
  documentId: string
  selection: string
  cursorPosition: number
  editor?: any
}

let toolContext: ToolContext = {
  documentContent: '',
  documentTitle: '',
  documentId: '',
  selection: '',
  cursorPosition: 0,
}

export function setToolContext(ctx: Partial<ToolContext>) {
  toolContext = { ...toolContext, ...ctx }
}

export function getToolContext(): ToolContext {
  return { ...toolContext }
}

function tiptapToPlainText(json: string): string {
  try {
    const doc = JSON.parse(json)
    if (doc.type !== 'doc' || !doc.content) return json
    const walk = (node: any): string => {
      if (node.type === 'text') return node.text || ''
      if (node.type === 'hardBreak') return '\n'
      if (node.content) return node.content.map(walk).join('')
      return ''
    }
    return doc.content.map(walk).join('\n')
  } catch {
    return json
  }
}

// ==================== Phase 1: 基础工具 ====================

export const insertTextTool = new DynamicTool({
  name: 'insert_text',
  description: '在编辑器指定位置插入文本。参数: text(要插入的文本), position(插入位置, -1表示当前光标)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      return JSON.stringify({
        action: 'insert',
        text: args.text,
        position: args.position ?? -1,
        message: `已插入 ${args.text?.length || 0} 个字符`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const replaceTextTool = new DynamicTool({
  name: 'replace_text',
  description: '替换编辑器中选中的文本。参数: text(替换后的文本)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const original = toolContext.selection || '(无选中文本)'
      return JSON.stringify({
        action: 'replace',
        original,
        replacement: args.text,
        message: '已替换选中文本',
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const readDocumentTool = new DynamicTool({
  name: 'read_document',
  description: '读取文档内容。参数: docId(文档ID,可选,不传则读取当前文档)',
  func: async (input: string) => {
    try {
      let targetDocId = toolContext.documentId
      let content = toolContext.documentContent
      let title = toolContext.documentTitle

      if (input) {
        try {
          const args = JSON.parse(input)
          if (args.docId) {
            targetDocId = args.docId
            const doc = useDocumentStore.getState().documents.find(d => d.id === args.docId)
            if (doc) {
              content = JSON.stringify(doc.content)
              title = doc.title
            } else {
              return JSON.stringify({ error: `文档 ${args.docId} 不存在` })
            }
          }
        } catch {
          // If not JSON, treat as docId
          if (typeof input === 'string' && input.trim()) {
            const doc = useDocumentStore.getState().documents.find(d => d.id === input.trim())
            if (doc) {
              content = JSON.stringify(doc.content)
              title = doc.title
              targetDocId = doc.id
            } else {
              return JSON.stringify({ error: `文档 ${input} 不存在` })
            }
          }
        }
      }

      const text = tiptapToPlainText(content || '')
      const preview = text.length > 2000 ? text.slice(0, 2000) + '...' : text
      return JSON.stringify({
        docId: targetDocId,
        title,
        length: text.length,
        preview,
      })
    } catch (err) {
      return JSON.stringify({ error: `读取文档失败: ${(err as Error).message}` })
    }
  },
})

export const readOutlineTool = new DynamicTool({
  name: 'read_outline',
  description: '读取文档的大纲结构（标题列表）',
  func: async () => {
    try {
      const content = JSON.parse(toolContext.documentContent || '{}')
      const headings: { level: number; text: string }[] = []
      const walk = (node: any) => {
        if (node.type === 'heading') {
          headings.push({
            level: node.attrs?.level || 1,
            text: node.content?.map((c: any) => c.text).join('') || '',
          })
        }
        if (node.content) node.content.forEach(walk)
      }
      if (content.content) content.content.forEach(walk)
      return JSON.stringify({ headings })
    } catch {
      return JSON.stringify({ headings: [], error: '无法解析文档结构' })
    }
  },
})

export const searchWebTool = new DynamicTool({
  name: 'search_web',
  description: '搜索网络获取信息（使用DuckDuckGo免费搜索）',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const query = args.query
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return JSON.stringify({ error: '请提供搜索关键词' })
      }

      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) })

      if (!resp.ok) {
        return JSON.stringify({
          query,
          results: [{ title: `搜索: ${query}`, snippet: `请求失败 (${resp.status})`, url: '#' }],
          message: `搜索请求失败: ${resp.status}`,
        })
      }

      const data = await resp.json()
      const results: Array<{ title: string; snippet: string; url: string }> = []

      if (data.AbstractText) {
        results.push({ title: data.Heading || query, snippet: data.AbstractText, url: data.AbstractURL || '#' })
      }

      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text) {
            results.push({
              title: topic.Text.slice(0, 60),
              snippet: topic.Text,
              url: topic.FirstURL || '#',
            })
          }
        }
      }

      if (results.length === 0) {
        results.push({
          title: `搜索: ${query}`,
          snippet: `DuckDuckGo未找到关于"${query}"的直接结果。建议尝试更具体的关键词。`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        })
      }

      return JSON.stringify({
        query,
        results,
        message: `找到 ${results.length} 条结果`,
      })
    } catch (err) {
      return JSON.stringify({ error: `搜索失败: ${(err as Error).message}` })
    }
  },
})

export const getWordCountTool = new DynamicTool({
  name: 'get_word_count',
  description: '获取当前文档的字数统计',
  func: async () => {
    try {
      const raw = toolContext.documentContent || ''
      const text = tiptapToPlainText(raw)
      const chars = text.length
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      return JSON.stringify({ chars, words, message: `${chars} 字符, ${words} 词` })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const createDocumentTool = new DynamicTool({
  name: 'create_document',
  description: '创建新文档并打开。参数: title(文档标题), content(初始内容,可选)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.title) return JSON.stringify({ error: '请提供文档标题' })

      const initialContent = args.content
        ? {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: args.content }] }],
          }
        : {
            type: 'doc',
            content: [{ type: 'paragraph' }],
          }

      return JSON.stringify({
        action: 'create',
        title: args.title,
        content: initialContent,
        message: `已创建文档: ${args.title}`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const suggestEditTool = new DynamicTool({
  name: 'suggest_edit',
  description: '建议编辑内容（需要用户确认后执行）。参数: description(修改说明), before(原文), after(修改后的内容)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      return JSON.stringify({
        action: 'suggest',
        requireReview: true,
        description: args.description,
        before: args.before,
        after: args.after,
        message: `建议修改: ${args.description}`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

// ==================== Phase 1: 新增工具 ====================

export const formatTextTool = new DynamicTool({
  name: 'format_text',
  description: '格式化选中文本。参数: format(格式类型), value(可选值)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const format = args.format
      const value = args.value
      const original = toolContext.selection || '(无选中文本)'

      const validFormats = ['bold', 'italic', 'underline', 'strike', 'heading1', 'heading2', 'heading3', 
                           'bulletList', 'orderedList', 'blockquote', 'codeBlock', 'highlight', 'clear']
      
      if (!validFormats.includes(format)) {
        return JSON.stringify({ 
          error: `无效的格式类型: ${format}。支持的格式: ${validFormats.join(', ')}` 
        })
      }

      return JSON.stringify({
        action: 'format',
        format,
        value,
        original,
        message: `已应用格式: ${format}`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const findInDocumentTool = new DynamicTool({
  name: 'find_in_document',
  description: '在文档中搜索文本。参数: query(搜索关键词), useRegex(是否正则,可选), caseSensitive(区分大小写,可选)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const query = args.query
      if (!query) return JSON.stringify({ error: '请提供搜索关键词' })

      const content = toolContext.documentContent || ''
      const text = tiptapToPlainText(content)
      
      const useRegex = args.useRegex || false
      const caseSensitive = args.caseSensitive || false
      
      let matches: { index: number; length: number; context: string }[] = []
      
      try {
        let regex: RegExp
        if (useRegex) {
          regex = new RegExp(query, caseSensitive ? 'g' : 'gi')
        } else {
          const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi')
        }
        
        let match
        while ((match = regex.exec(text)) !== null) {
          const start = Math.max(0, match.index - 20)
          const end = Math.min(text.length, match.index + match[0].length + 20)
          matches.push({
            index: match.index,
            length: match[0].length,
            context: text.slice(start, end),
          })
          if (matches.length >= 100) break // Limit results
        }
      } catch (err) {
        return JSON.stringify({ error: `正则表达式错误: ${(err as Error).message}` })
      }

      return JSON.stringify({
        query,
        totalMatches: matches.length,
        matches: matches.slice(0, 20), // Return first 20 matches
        message: `找到 ${matches.length} 处匹配`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const replaceInDocumentTool = new DynamicTool({
  name: 'replace_in_document',
  description: '在文档中替换文本。参数: find(查找文本), replace(替换文本), replaceAll(是否全部替换,默认false)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.find) return JSON.stringify({ error: '请提供查找文本' })
      if (args.replace === undefined) return JSON.stringify({ error: '请提供替换文本' })

      return JSON.stringify({
        action: 'replaceAll',
        find: args.find,
        replace: args.replace,
        replaceAll: args.replaceAll || false,
        message: `已替换 "${args.find}" 为 "${args.replace}"${args.replaceAll ? ' (全部)' : ' (首个)'}`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const deleteDocumentTool = new DynamicTool({
  name: 'delete_document',
  description: '删除指定文档。参数: docId(文档ID), confirm(确认删除,必须为true)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.docId) return JSON.stringify({ error: '请提供文档ID' })
      if (args.confirm !== true) return JSON.stringify({ error: '请设置confirm为true以确认删除' })

      const doc = useDocumentStore.getState().documents.find(d => d.id === args.docId)
      if (!doc) return JSON.stringify({ error: `文档 ${args.docId} 不存在` })

      return JSON.stringify({
        action: 'delete',
        docId: args.docId,
        title: doc.title,
        requireReview: true,
        message: `确定要删除文档 "${doc.title}" 吗？`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const renameDocumentTool = new DynamicTool({
  name: 'rename_document',
  description: '重命名文档。参数: docId(文档ID), newTitle(新标题)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.docId) return JSON.stringify({ error: '请提供文档ID' })
      if (!args.newTitle) return JSON.stringify({ error: '请提供新标题' })

      const doc = useDocumentStore.getState().documents.find(d => d.id === args.docId)
      if (!doc) return JSON.stringify({ error: `文档 ${args.docId} 不存在` })

      return JSON.stringify({
        action: 'rename',
        docId: args.docId,
        oldTitle: doc.title,
        newTitle: args.newTitle,
        message: `已将文档重命名为 "${args.newTitle}"`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const moveDocumentTool = new DynamicTool({
  name: 'move_document',
  description: '移动文档到文件夹。参数: docId(文档ID), folderId(文件夹ID,null表示移动到根目录)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.docId) return JSON.stringify({ error: '请提供文档ID' })

      const doc = useDocumentStore.getState().documents.find(d => d.id === args.docId)
      if (!doc) return JSON.stringify({ error: `文档 ${args.docId} 不存在` })

      if (args.folderId) {
        const folder = useDocumentStore.getState().folders.find(f => f.id === args.folderId)
        if (!folder) return JSON.stringify({ error: `文件夹 ${args.folderId} 不存在` })
      }

      return JSON.stringify({
        action: 'move',
        docId: args.docId,
        folderId: args.folderId || null,
        title: doc.title,
        message: args.folderId ? `已将文档移动到文件夹` : `已将文档移动到根目录`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const createFolderTool = new DynamicTool({
  name: 'create_folder',
  description: '创建文件夹。参数: name(文件夹名称), parentId(父文件夹ID,可选)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.name) return JSON.stringify({ error: '请提供文件夹名称' })

      return JSON.stringify({
        action: 'createFolder',
        name: args.name,
        parentId: args.parentId || null,
        message: `已创建文件夹 "${args.name}"`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

// ==================== Phase 2: 标签页和撤销/重做工具 ====================

export const openTabTool = new DynamicTool({
  name: 'open_tab',
  description: '打开文档的标签页。参数: docId(文档ID)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.docId) return JSON.stringify({ error: '请提供文档ID' })

      const doc = useDocumentStore.getState().documents.find(d => d.id === args.docId)
      if (!doc) return JSON.stringify({ error: `文档 ${args.docId} 不存在` })

      return JSON.stringify({
        action: 'openTab',
        docId: args.docId,
        title: doc.title,
        message: `已打开标签页 "${doc.title}"`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const closeTabTool = new DynamicTool({
  name: 'close_tab',
  description: '关闭文档标签页。参数: docId(文档ID)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.docId) return JSON.stringify({ error: '请提供文档ID' })

      const tab = useTabStore.getState().openTabs.find(t => t.docId === args.docId)
      if (!tab) return JSON.stringify({ error: `标签页 ${args.docId} 不存在` })

      return JSON.stringify({
        action: 'closeTab',
        docId: args.docId,
        title: tab.title,
        message: `已关闭标签页 "${tab.title}"`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const listTabsTool = new DynamicTool({
  name: 'list_tabs',
  description: '列出当前打开的所有标签页',
  func: async () => {
    try {
      const tabs = useTabStore.getState().openTabs
      const activeTabId = useTabStore.getState().activeTabId
      
      return JSON.stringify({
        tabs: tabs.map(t => ({
          docId: t.docId,
          title: t.title,
          isActive: t.docId === activeTabId,
        })),
        total: tabs.length,
        message: `共 ${tabs.length} 个标签页`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const switchTabTool = new DynamicTool({
  name: 'switch_tab',
  description: '切换到指定标签页。参数: docId(文档ID)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.docId) return JSON.stringify({ error: '请提供文档ID' })

      const tab = useTabStore.getState().openTabs.find(t => t.docId === args.docId)
      if (!tab) return JSON.stringify({ error: `标签页 ${args.docId} 不存在` })

      return JSON.stringify({
        action: 'switchTab',
        docId: args.docId,
        title: tab.title,
        message: `已切换到标签页 "${tab.title}"`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const undoTool = new DynamicTool({
  name: 'undo',
  description: '执行撤销操作',
  func: async () => {
    try {
      return JSON.stringify({
        action: 'undo',
        message: '已执行撤销操作',
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const redoTool = new DynamicTool({
  name: 'redo',
  description: '执行重做操作',
  func: async () => {
    try {
      return JSON.stringify({
        action: 'redo',
        message: '已执行重做操作',
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== Phase 3: 增强工具 ====================

export const createCodeBlockTool = new DynamicTool({
  name: 'create_code_block',
  description: '创建代码块。参数: language(编程语言), code(初始代码,可选)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const language = args.language || 'plaintext'
      
      return JSON.stringify({
        action: 'createCodeBlock',
        language,
        code: args.code || '',
        message: `已创建 ${language} 代码块`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const addCommentTool = new DynamicTool({
  name: 'add_comment',
  description: '为选中文本添加评论。参数: content(评论内容)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.content) return JSON.stringify({ error: '请提供评论内容' })

      const selection = toolContext.selection
      const docId = toolContext.documentId
      if (!docId) return JSON.stringify({ error: '无当前文档' })
      if (!selection) return JSON.stringify({ error: '请先选中文本再添加评论' })

      const { addComment } = useCommentStore.getState()
      const commentId = addComment({
        documentId: docId,
        author: 'AI Agent',
        content: args.content,
        selection,
      })

      return JSON.stringify({
        action: 'addComment',
        commentId,
        content: args.content,
        selection,
        message: `已添加评论: "${args.content.slice(0, 30)}..."`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const listCommentsTool = new DynamicTool({
  name: 'list_comments',
  description: '列出当前文档的所有评论',
  func: async () => {
    try {
      const docId = toolContext.documentId
      if (!docId) return JSON.stringify({ error: '无当前文档' })

      const { getDocumentComments } = useCommentStore.getState()
      const comments = getDocumentComments(docId)
      
      return JSON.stringify({
        comments: comments.map(c => ({
          id: c.id,
          author: c.author,
          content: c.content,
          selection: c.selection,
          resolved: c.resolved,
          createdAt: c.createdAt,
          repliesCount: c.replies.length,
        })),
        total: comments.length,
        message: `共 ${comments.length} 条评论`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const createVersionTool = new DynamicTool({
  name: 'create_version',
  description: '创建当前文档的版本快照',
  func: async () => {
    try {
      return JSON.stringify({
        action: 'createVersion',
        message: '已创建版本快照',
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const listVersionsTool = new DynamicTool({
  name: 'list_versions',
  description: '列出当前文档的所有版本',
  func: async () => {
    try {
      const docId = toolContext.documentId
      if (!docId) return JSON.stringify({ error: '无当前文档' })

      const versions = useDocumentStore.getState().getVersions(docId)
      return JSON.stringify({
        versions: versions.map(v => ({
          id: v.id,
          title: v.title,
          createdAt: v.createdAt,
        })),
        total: versions.length,
        message: `共 ${versions.length} 个版本`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const restoreVersionTool = new DynamicTool({
  name: 'restore_version',
  description: '恢复到指定版本。参数: versionId(版本ID)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.versionId) return JSON.stringify({ error: '请提供版本ID' })

      const docId = toolContext.documentId
      if (!docId) return JSON.stringify({ error: '无当前文档' })

      return JSON.stringify({
        action: 'restoreVersion',
        versionId: args.versionId,
        requireReview: true,
        message: `确定要恢复到版本 ${args.versionId} 吗？`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const getWritingStatsTool = new DynamicTool({
  name: 'get_writing_stats',
  description: '获取写作统计数据',
  func: async () => {
    try {
      const { getTodayStats, getWeekStats, getMonthStats, totalWordsWritten, totalTimeSpent } = useWritingStatsStore.getState()
      
      // 获取当前文档统计
      const content = toolContext.documentContent || ''
      const text = tiptapToPlainText(content)
      const chars = text.length
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim()).length
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length

      // 获取今日统计
      const todayStats = getTodayStats()
      const weekStats = getWeekStats()
      const monthStats = getMonthStats()

      return JSON.stringify({
        currentDocument: {
          chars,
          words,
          sentences,
          paragraphs,
          readingTime: Math.ceil(chars / 500),
        },
        today: {
          wordsWritten: todayStats.wordsWritten,
          timeSpent: todayStats.timeSpent,
          sessionsCount: todayStats.sessionsCount,
        },
        week: {
          totalWords: weekStats.reduce((sum, day) => sum + day.wordsWritten, 0),
          totalTime: weekStats.reduce((sum, day) => sum + day.timeSpent, 0),
        },
        month: {
          totalWords: monthStats.reduce((sum, day) => sum + day.wordsWritten, 0),
          totalTime: monthStats.reduce((sum, day) => sum + day.timeSpent, 0),
        },
        allTime: {
          totalWordsWritten,
          totalTimeSpent,
        },
        message: `今日: ${todayStats.wordsWritten} 字, 总计: ${totalWordsWritten} 字`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== Phase 4: 字数目标管理工具 ====================

export const setWordGoalTool = new DynamicTool({
  name: 'set_word_goal',
  description: '设置字数目标。参数: type(daily/chapter/novel), goal(目标字数)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.type || !args.goal) return JSON.stringify({ error: '请提供目标类型和目标字数' })

      const { setDailyGoal, setChapterGoal, setNovelGoal } = useWordGoalStore.getState()
      
      if (args.type === 'daily') {
        setDailyGoal(args.goal)
      } else if (args.type === 'chapter') {
        setChapterGoal(args.goal)
      } else if (args.type === 'novel') {
        setNovelGoal(args.goal)
      } else {
        return JSON.stringify({ error: '无效的目标类型，支持: daily, chapter, novel' })
      }

      return JSON.stringify({
        action: 'setWordGoal',
        type: args.type,
        goal: args.goal,
        message: `已设置${args.type === 'daily' ? '每日' : args.type === 'chapter' ? '章节' : '小说'}目标: ${args.goal} 字`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const getWordGoalProgressTool = new DynamicTool({
  name: 'get_word_goal_progress',
  description: '获取字数目标进度',
  func: async () => {
    try {
      const { goals, progress, getDailyPercent, getChapterPercent, getNovelPercent } = useWordGoalStore.getState()
      
      return JSON.stringify({
        goals: {
          daily: goals.daily,
          chapter: goals.chapter,
          novel: goals.novel,
        },
        progress: {
          daily: progress.daily,
          chapter: progress.chapter,
          novel: progress.novel,
        },
        percent: {
          daily: getDailyPercent(),
          chapter: getChapterPercent(),
          novel: getNovelPercent(),
        },
        message: `每日: ${progress.daily}/${goals.daily} (${getDailyPercent()}%), 章节: ${progress.chapter}/${goals.chapter} (${getChapterPercent()}%), 小说: ${progress.novel}/${goals.novel} (${getNovelPercent()}%)`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== Phase 5: 主题和UI控制工具 ====================

export const toggleThemeTool = new DynamicTool({
  name: 'toggle_theme',
  description: '切换深色/浅色主题',
  func: async () => {
    try {
      const { toggleTheme, theme } = useThemeStore.getState()
      toggleTheme()
      const newTheme = theme === 'dark' ? 'light' : 'dark'
      return JSON.stringify({
        action: 'toggleTheme',
        previousTheme: theme,
        newTheme,
        message: `已从${theme === 'dark' ? '深色' : '浅色'}主题切换到${newTheme === 'dark' ? '深色' : '浅色'}主题`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const toggleWordWrapTool = new DynamicTool({
  name: 'toggle_word_wrap',
  description: '切换自动换行',
  func: async () => {
    try {
      const { toggleWordWrap, wordWrap } = useThemeStore.getState()
      toggleWordWrap()
      return JSON.stringify({
        action: 'toggleWordWrap',
        previousState: wordWrap,
        newState: !wordWrap,
        message: `已${wordWrap ? '关闭' : '开启'}自动换行`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const toggleSidebarTool = new DynamicTool({
  name: 'toggle_sidebar',
  description: '切换侧边栏显示',
  func: async () => {
    try {
      const { setSidebarOpen, sidebarOpen } = useUIStore.getState()
      setSidebarOpen(!sidebarOpen)
      return JSON.stringify({
        action: 'toggleSidebar',
        isOpen: !sidebarOpen,
        message: `已${sidebarOpen ? '隐藏' : '显示'}侧边栏`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const toggleFocusModeTool = new DynamicTool({
  name: 'toggle_focus_mode',
  description: '切换专注模式',
  func: async () => {
    try {
      const { toggleFocusMode, focusMode } = useUIStore.getState()
      toggleFocusMode()
      return JSON.stringify({
        action: 'toggleFocusMode',
        isActive: !focusMode,
        message: `已${focusMode ? '退出' : '进入'}专注模式`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const toggleAIPanelTool = new DynamicTool({
  name: 'toggle_ai_panel',
  description: '切换AI面板显示',
  func: async () => {
    try {
      const { setAiPanelOpen, aiPanelOpen } = useUIStore.getState()
      setAiPanelOpen(!aiPanelOpen)
      return JSON.stringify({
        action: 'toggleAIPanel',
        isOpen: !aiPanelOpen,
        message: `已${aiPanelOpen ? '隐藏' : '显示'}AI面板`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== Phase 6: 高级功能工具 ====================

export const getCollaborationStatusTool = new DynamicTool({
  name: 'get_collaboration_status',
  description: '获取协作状态信息',
  func: async () => {
    try {
      const { isConnected, documentId, collaborators, pendingOperations, syncVersion } = useCollaborationStore.getState()
      
      return JSON.stringify({
        isConnected,
        documentId,
        collaborators: collaborators.map(c => ({
          id: c.id,
          name: c.name,
          color: c.color,
          hasCursor: !!c.cursor,
        })),
        pendingOperations,
        syncVersion,
        message: isConnected ? `已连接，${collaborators.length} 个协作者` : '未连接',
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const toggleAutoSaveTool = new DynamicTool({
  name: 'toggle_auto_save',
  description: '切换自动保存功能',
  func: async () => {
    try {
      const { toggleAutoSave, autoSaveEnabled } = useAutoSaveStore.getState()
      toggleAutoSave()
      return JSON.stringify({
        action: 'toggleAutoSave',
        isEnabled: !autoSaveEnabled,
        message: `已${autoSaveEnabled ? '关闭' : '开启'}自动保存`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const setAutoSaveStrategyTool = new DynamicTool({
  name: 'set_auto_save_strategy',
  description: '设置自动保存策略。参数: strategy(auto/manual/smart)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.strategy) return JSON.stringify({ error: '请提供保存策略' })

      const validStrategies = ['auto', 'manual', 'smart']
      if (!validStrategies.includes(args.strategy)) {
        return JSON.stringify({ error: `无效的策略，支持: ${validStrategies.join(', ')}` })
      }

      const { setStrategy } = useAutoSaveStore.getState()
      setStrategy(args.strategy)
      
      return JSON.stringify({
        action: 'setAutoSaveStrategy',
        strategy: args.strategy,
        message: `已设置自动保存策略为: ${args.strategy}`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const setAutoSaveIntervalTool = new DynamicTool({
  name: 'set_auto_save_interval',
  description: '设置自动保存间隔。参数: interval(毫秒)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.interval || typeof args.interval !== 'number') {
        return JSON.stringify({ error: '请提供有效的间隔时间(毫秒)' })
      }

      const store = useAutoSaveStore.getState()
      store.setInterval(args.interval)
      
      return JSON.stringify({
        action: 'setAutoSaveInterval',
        interval: args.interval,
        message: `已设置自动保存间隔为 ${args.interval} 毫秒`,
      })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const toggleHighContrastTool = new DynamicTool({
  name: 'toggle_high_contrast',
  description: '切换高对比度模式',
  func: async () => {
    try {
      const { toggle, enabled } = useHighContrastStore.getState()
      toggle()
      return JSON.stringify({
        action: 'toggleHighContrast',
        isEnabled: !enabled,
        message: `已${enabled ? '关闭' : '开启'}高对比度模式`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const setCustomThemeTool = new DynamicTool({
  name: 'set_custom_theme',
  description: '设置自定义主题颜色。参数: preset(预设名称) 或 colors(自定义颜色)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const { setCustomColors, resetCustomColors } = useCustomThemeStore.getState()
      
      if (args.preset === 'reset') {
        resetCustomColors()
        return JSON.stringify({
          action: 'resetCustomTheme',
          message: '已重置为默认主题',
        })
      }
      
      if (args.colors) {
        setCustomColors(args.colors)
        return JSON.stringify({
          action: 'setCustomTheme',
          colors: args.colors,
          message: '已设置自定义主题颜色',
        })
      }
      
      return JSON.stringify({ error: '请提供 preset(预设名称) 或 colors(自定义颜色)' })
    } catch {
      return JSON.stringify({ error: '参数解析失败' })
    }
  },
})

export const getDocumentCacheStatsTool = new DynamicTool({
  name: 'get_document_cache_stats',
  description: '获取文档缓存统计信息',
  func: async () => {
    try {
      const { getCacheStats, cache } = useDocumentCacheStore.getState()
      const stats = getCacheStats()
      
      const cachedDocs = Object.entries(cache)
        .filter(([_, entry]) => entry.isLoaded)
        .map(([docId, entry]) => ({
          docId,
          lastAccessed: entry.lastAccessed,
          hasContent: !!entry.content,
        }))
      
      return JSON.stringify({
        stats,
        cachedDocs,
        message: `已加载 ${stats.loaded} 个文档，共 ${stats.total} 个缓存`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const clearDocumentCacheTool = new DynamicTool({
  name: 'clear_document_cache',
  description: '清空文档缓存',
  func: async () => {
    try {
      const { clearCache } = useDocumentCacheStore.getState()
      clearCache()
      return JSON.stringify({
        action: 'clearDocumentCache',
        message: '已清空文档缓存',
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== Phase 7: 高优先级工具 ====================

export const searchAllDocumentsTool = new DynamicTool({
  name: 'search_all_documents',
  description: '跨文档搜索内容。参数: query(搜索关键词), useRegex(是否正则,可选), caseSensitive(是否区分大小写,可选)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const { documents } = useDocumentStore.getState()
      const results: Array<{ docId: string; title: string; matches: Array<{ index: number; context: string }> }> = []

      for (const doc of documents) {
        const content = doc.content
        if (!content || typeof content !== 'object') continue
        const plainText = tiptapToPlainText(JSON.stringify(content))
        
        let regex: RegExp
        try {
          if (args.useRegex) {
            regex = new RegExp(args.query, args.caseSensitive ? 'g' : 'gi')
          } else {
            const escaped = args.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            regex = new RegExp(escaped, args.caseSensitive ? 'g' : 'gi')
          }
        } catch {
          return JSON.stringify({ error: '正则表达式语法错误' })
        }

        const matches: Array<{ index: number; context: string }> = []
        let match: RegExpExecArray | null
        while ((match = regex.exec(plainText)) !== null) {
          const start = Math.max(0, match.index - 20)
          const end = Math.min(plainText.length, match.index + match[0].length + 20)
          matches.push({
            index: match.index,
            context: `...${plainText.slice(start, end)}...`,
          })
          if (matches.length >= 5) break
        }

        if (matches.length > 0) {
          results.push({ docId: doc.id, title: doc.title, matches })
        }
      }

      return JSON.stringify({
        query: args.query,
        totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
        documentsFound: results.length,
        results,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const getDocumentTreeTool = new DynamicTool({
  name: 'get_document_tree',
  description: '获取项目文档树的完整结构（所有文档和文件夹的层级关系）',
  func: async () => {
    try {
      const { documents, folders, getDocumentsInFolder, getSubFolders } = useDocumentStore.getState()
      
      function buildTree(parentId: string | null): any[] {
        const items: any[] = []
        const subFolders = getSubFolders(parentId)
        for (const folder of subFolders) {
          items.push({
            type: 'folder',
            id: folder.id,
            name: folder.name,
            children: buildTree(folder.id),
          })
        }
        const docs = getDocumentsInFolder(parentId)
        for (const doc of docs) {
          items.push({
            type: 'document',
            id: doc.id,
            title: doc.title,
            docType: doc.type,
            updatedAt: doc.updatedAt,
          })
        }
        return items
      }

      const tree = buildTree(null)
      return JSON.stringify({
        totalDocuments: documents.length,
        totalFolders: folders.length,
        tree,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const exportDocumentTool = new DynamicTool({
  name: 'export_document',
  description: '导出文档为指定格式。参数: format(格式: markdown/docx/pdf/html/txt/epub/latex/rtf), docId(可选,不传则导出当前文档)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const { documents, getCurrentDoc } = useDocumentStore.getState()
      const doc = args.docId ? documents?.find((d) => d.id === args.docId) : getCurrentDoc?.()
      if (!doc) return JSON.stringify({ error: '文档不存在' })

      const format = (args.format || 'markdown').toLowerCase()
      return JSON.stringify({
        action: 'exportDocument',
        format,
        docId: doc.id,
        title: doc.title,
        content: doc.content,
        message: `准备导出「${doc.title}」为 ${format.toUpperCase()} 格式`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const batchExportTool = new DynamicTool({
  name: 'batch_export',
  description: '批量导出所有文档。参数: format(格式: markdown/docx/pdf/html/txt)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const { documents } = useDocumentStore.getState()
      if (!documents || documents.length === 0) return JSON.stringify({ error: '没有可导出的文档' })

      const format = (args.format || 'markdown').toLowerCase()
      return JSON.stringify({
        action: 'batchExport',
        requireReview: true,
        format,
        count: documents.length,
        docIds: documents.map((d) => d.id),
        message: `准备批量导出 ${documents.length} 个文档为 ${format.toUpperCase()} 格式`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const saveDocumentTool = new DynamicTool({
  name: 'save_document',
  description: '立即保存所有文档到 IndexedDB',
  func: async () => {
    try {
      await useDocumentStore.getState().saveToDB()
      return JSON.stringify({ action: 'saveDocument', message: '文档已保存' })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const triggerShortcutTool = new DynamicTool({
  name: 'trigger_shortcut',
  description: '触发键盘快捷键。参数: shortcutId(快捷键ID,如 save/bold/italic/undo/redo/findReplace/focusMode/fullscreen)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const shortcut = useShortcutStore.getState().getShortcut(args.shortcutId)
      if (!shortcut) {
        const available = useShortcutStore.getState().shortcuts.map((s) => `${s.id}(${s.code})`)
        return JSON.stringify({ error: `快捷键不存在: ${args.shortcutId}`, available })
      }

      const event = new KeyboardEvent('keydown', {
        key: shortcut.key,
        ctrlKey: shortcut.ctrl,
        shiftKey: shortcut.shift,
        altKey: shortcut.alt,
        bubbles: true,
      })
      document.dispatchEvent(event)
      return JSON.stringify({ action: 'triggerShortcut', shortcutId: shortcut.id, code: shortcut.code, message: `已触发快捷键: ${shortcut.code}` })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const spellCheckTool = new DynamicTool({
  name: 'spell_check',
  description: '对文档进行拼写和语法检查（调用 LanguageTool 外部API）。参数: docId(可选), language(语言代码,默认zh)',
  func: async (input: string) => {
    const args = JSON.parse(input || '{}')
    try {
      const { documents, getCurrentDoc } = useDocumentStore.getState()
      const doc = args.docId ? documents?.find((d) => d.id === args.docId) : getCurrentDoc?.()
      if (!doc) return JSON.stringify({ error: '文档不存在' })

      const content = doc.content
      if (!content || typeof content !== 'object') return JSON.stringify({ error: '文档内容为空' })
      const plainText = tiptapToPlainText(JSON.stringify(content))

      const language = args.language || 'zh'
      const issues: Array<{ type: string; message: string; suggestion?: string; offset?: number; length?: number }> = []

      // 调用 LanguageTool 公共 API
      try {
        const formData = new URLSearchParams()
        formData.append('text', plainText)
        formData.append('language', language)
        formData.append('enabledOnly', 'false')

        const response = await fetch('https://api.languagetool.org/v2/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
          signal: AbortSignal.timeout(15000),
        })

        if (response.ok) {
          const data = await response.json()
          for (const match of (data.matches || []).slice(0, 50)) {
            issues.push({
              type: match.rule?.category?.name || 'grammar',
              message: match.message,
              suggestion: match.replacements?.[0]?.value,
              offset: match.offset,
              length: match.length,
            })
          }
        } else {
          // API 不可用时降级为本地正则检查
          const repeatedPunctuation = /([。！？，、；：])\1+/g
          let match: RegExpExecArray | null
          while ((match = repeatedPunctuation.exec(plainText)) !== null) {
            issues.push({ type: 'repetition', message: `重复标点: "${match[0]}"`, suggestion: match[0][0] })
          }
          const consecutiveSpaces = / {2,}/g
          while ((match = consecutiveSpaces.exec(plainText)) !== null) {
            issues.push({ type: 'spacing', message: `多余空格: "${match[0]}"`, suggestion: ' ' })
          }
        }
      } catch {
        // 网络失败时降级为本地正则检查
        const repeatedPunctuation = /([。！？，、；：])\1+/g
        let match: RegExpExecArray | null
        while ((match = repeatedPunctuation.exec(plainText)) !== null) {
          issues.push({ type: 'repetition', message: `重复标点: "${match[0]}"`, suggestion: match[0][0] })
        }
        const consecutiveSpaces = / {2,}/g
        while ((match = consecutiveSpaces.exec(plainText)) !== null) {
          issues.push({ type: 'spacing', message: `多余空格: "${match[0]}"`, suggestion: ' ' })
        }
      }

      return JSON.stringify({
        action: 'spellCheck',
        docId: doc.id,
        title: doc.title,
        totalIssues: issues.length,
        issues,
        wordCount: plainText.length,
        language,
        message: issues.length === 0 ? '未发现问题' : `发现 ${issues.length} 个潜在问题`,
      })
    } catch {
      return JSON.stringify({ error: '无法访问文档存储' })
    }
  },
})

// ==================== Phase 8: 中优先级工具 ====================

export const updateDocumentMetadataTool = new DynamicTool({
  name: 'update_document_metadata',
  description: '修改文档元数据。参数: docId(文档ID), type(新类型: chapter/scene/character/code_snippet, 可选), parentId(新父文档ID, 可选)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.docId) return JSON.stringify({ error: '缺少文档ID' })

      const { documents, updateDoc } = useDocumentStore.getState()
      const doc = documents.find((d) => d.id === args.docId)
      if (!doc) return JSON.stringify({ error: '文档不存在' })

      const updates: any = {}
      if (args.type) updates.type = args.type
      if (args.parentId !== undefined) updates.parentId = args.parentId
      if (Object.keys(updates).length === 0) return JSON.stringify({ error: '没有要更新的字段' })

      updateDoc(args.docId, updates)
      return JSON.stringify({ action: 'updateMetadata', docId: args.docId, updates, message: '元数据已更新' })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const editOutlineTool = new DynamicTool({
  name: 'edit_outline',
  description: '修改文档大纲。参数: action(add/addAfter/remove), level(标题级别1-3), text(标题文本, add时必填), insertAfterText(插入位置的标题文本, addAfter时必填)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      return JSON.stringify({
        action: 'editOutline',
        outlineAction: args.action,
        level: args.level,
        text: args.text,
        insertAfterText: args.insertAfterText,
        message: `大纲操作: ${args.action}`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const editorToMarkdownTool = new DynamicTool({
  name: 'editor_to_markdown',
  description: '将当前文档内容转换为 Markdown 格式返回',
  func: async () => {
    try {
      const { getCurrentDoc } = useDocumentStore.getState()
      const doc = getCurrentDoc?.()
      if (!doc) return JSON.stringify({ error: '没有打开的文档' })

      const markdown = tiptapToMarkdown(doc.content)
      return JSON.stringify({
        action: 'editorToMarkdown',
        title: doc.title,
        markdown,
        length: markdown.length,
      })
    } catch {
      return JSON.stringify({ error: '无法访问文档存储' })
    }
  },
})

export const markdownToEditorTool = new DynamicTool({
  name: 'markdown_to_editor',
  description: '将 Markdown 文本转换为编辑器格式并插入。参数: markdown(Markdown文本)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.markdown) return JSON.stringify({ error: '缺少markdown参数' })

      return JSON.stringify({
        action: 'markdownToEditor',
        requireReview: true,
        markdown: args.markdown,
        message: 'Markdown内容已准备就绪',
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const createBackupTool = new DynamicTool({
  name: 'create_backup',
  description: '创建当前所有文档的备份',
  func: async () => {
    try {
      const backup = await createBackup()
      return JSON.stringify({
        action: 'createBackup',
        backupId: backup.id,
        documentCount: backup.metadata.documentCount,
        folderCount: backup.metadata.folderCount,
        message: `已创建备份，包含 ${backup.metadata.documentCount} 个文档和 ${backup.metadata.folderCount} 个文件夹`,
      })
    } catch {
      return JSON.stringify({ error: '备份创建失败' })
    }
  },
})

export const restoreBackupTool = new DynamicTool({
  name: 'restore_backup',
  description: '恢复备份。参数: backupId(备份ID, 不传则恢复最近的备份)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    let backupId = args.backupId

    if (!backupId) {
      const backups = await getBackups()
      if (backups.length === 0) return JSON.stringify({ error: '没有可用的备份' })
      backupId = backups[0].id
    }

    const success = await restoreBackup(backupId)
    if (!success) return JSON.stringify({ error: '备份恢复失败' })

    await useDocumentStore.getState().loadFromDB()
    return JSON.stringify({ action: 'restoreBackup', backupId, message: '备份已恢复' })
  },
})

export const listBackupsTool = new DynamicTool({
  name: 'list_backups',
  description: '列出所有可用备份',
  func: async () => {
    const backups = await getBackups()
    return JSON.stringify({
      totalBackups: backups.length,
      backups: backups.map((b) => ({
        id: b.id,
        timestamp: b.timestamp,
        date: new Date(b.timestamp).toLocaleString('zh-CN'),
        documentCount: b.metadata.documentCount,
        folderCount: b.metadata.folderCount,
      })),
    })
  },
})

export const validateDocumentTool = new DynamicTool({
  name: 'validate_document',
  description: '验证文档结构是否有效。参数: docId(可选,不传则验证当前文档)',
  func: async (input: string) => {
    const args = JSON.parse(input || '{}')
    try {
      const { documents, getCurrentDoc } = useDocumentStore.getState()
      const doc = args.docId ? documents?.find((d) => d.id === args.docId) : getCurrentDoc?.()
      if (!doc) return JSON.stringify({ error: '文档不存在' })

      const result = validateDocument(doc)
      return JSON.stringify({
        action: 'validateDocument',
        docId: doc.id,
        title: doc.title,
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings,
        message: result.valid ? '文档结构有效' : `发现 ${result.errors.length} 个错误`,
      })
    } catch {
      return JSON.stringify({ error: '无法访问文档存储' })
    }
  },
})

// ==================== Phase 9: 低优先级工具 ====================

export const showToastTool = new DynamicTool({
  name: 'show_toast',
  description: '显示通知消息。参数: message(消息内容), type(类型: info/success/error/warning)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const msg = args.message || '通知'
      switch (args.type) {
        case 'success': showSuccess(msg); break
        case 'error': showError(msg); break
        case 'warning': showWarning(msg); break
        default: showToast(msg)
      }
      return JSON.stringify({ action: 'showToast', message: msg, type: args.type || 'info' })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const preExportProcessTool = new DynamicTool({
  name: 'pre_export_process',
  description: '在导出前进行AI预处理。参数: action(summarize/reformat/clean), docId(可选)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const { documents, getCurrentDoc } = useDocumentStore.getState()
      const doc = args.docId ? documents?.find((d) => d.id === args.docId) : getCurrentDoc?.()
      if (!doc) return JSON.stringify({ error: '文档不存在' })

      const content = doc.content
      if (!content || typeof content !== 'object') return JSON.stringify({ error: '文档内容为空' })
      const plainText = tiptapToPlainText(JSON.stringify(content))

      return JSON.stringify({
        action: 'preExportProcess',
        processAction: args.action || 'clean',
        docId: doc.id,
        title: doc.title,
        originalLength: plainText.length,
        message: `准备对「${doc.title}」执行${args.action || 'clean'}预处理`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const openPanelTool = new DynamicTool({
  name: 'open_panel',
  description: '打开指定面板。参数: panel(findReplace/settings/versionHistory/writingStats/outline/wordCount/keyboardShortcuts/backup/templates)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const validPanels = ['findReplace', 'settings', 'versionHistory', 'writingStats', 'outline', 'wordCount', 'keyboardShortcuts', 'backup', 'templates']
      if (!validPanels.includes(args.panel)) {
        return JSON.stringify({ error: `无效面板: ${args.panel}`, available: validPanels })
      }
      return JSON.stringify({ action: 'openPanel', panel: args.panel, message: `已打开 ${args.panel} 面板` })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== Phase 10: AI配置与云同步 ====================

export const getAIConfigTool = new DynamicTool({
  name: 'get_ai_config',
  description: '获取当前AI配置（provider、model、baseUrl，不返回API key）',
  func: async () => {
    try {
      const config = getAIConfig()
      return JSON.stringify({
        action: 'getAIConfig',
        configured: !!config,
        provider: config?.provider || null,
        model: config?.model || null,
        baseUrl: config?.baseUrl?.replace(/\/+$/, '') || null,
        hasApiKey: !!config?.apiKey,
        maxConcurrent: config?.maxConcurrent || null,
        timeout: config?.timeout || null,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const setAIConfigTool = new DynamicTool({
  name: 'set_ai_config',
  description: '设置AI配置。参数: provider(openai/anthropic/custom), apiKey(API密钥), baseUrl(API地址), model(模型名)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      const current = getAIConfig()
      const config = {
        provider: args.provider || current?.provider || 'openai',
        apiKey: args.apiKey || current?.apiKey || '',
        baseUrl: args.baseUrl || current?.baseUrl || 'https://api.openai.com',
        model: args.model || current?.model || 'gpt-3.5-turbo',
        maxConcurrent: args.maxConcurrent || current?.maxConcurrent,
        timeout: args.timeout || current?.timeout,
      }
      saveAIConfig(config)
      return JSON.stringify({ action: 'setAIConfig', message: 'AI配置已更新', provider: config.provider, model: config.model })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const clearAIConfigTool = new DynamicTool({
  name: 'clear_ai_config',
  description: '清除AI配置',
  func: async () => {
    try {
      clearAIConfig()
      return JSON.stringify({ action: 'clearAIConfig', message: 'AI配置已清除' })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const getCloudConfigTool = new DynamicTool({
  name: 'get_cloud_config',
  description: '获取云同步配置和状态',
  func: async () => {
    try {
      const config = getCloudConfig()
      const status = getSyncStatus()
      return JSON.stringify({
        action: 'getCloudConfig',
        configured: !!config,
        provider: config?.provider || null,
        server: config?.server || null,
        repo: config?.repo || null,
        hasToken: !!config?.token,
        hasPassword: !!config?.password,
        status,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const setCloudConfigTool = new DynamicTool({
  name: 'set_cloud_config',
  description: '设置云同步配置。参数: provider(webdav/github/gitee), server(WebDAV地址), token(GitHub/Gitee token), repo(仓库名), path(路径)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.provider) return JSON.stringify({ error: '缺少provider参数' })
      const config = {
        provider: args.provider,
        server: args.server,
        token: args.token,
        repo: args.repo,
        path: args.path,
      }
      saveCloudConfig(config)
      return JSON.stringify({ action: 'setCloudConfig', message: '云同步配置已更新', provider: args.provider })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const testCloudConnectionTool = new DynamicTool({
  name: 'test_cloud_connection',
  description: '测试云同步连接',
  func: async () => {
    const config = getCloudConfig()
    if (!config) return JSON.stringify({ error: '未配置云同步' })
    try {
      const success = await testConnection(config)
      return JSON.stringify({ action: 'testCloudConnection', success, message: success ? '连接成功' : '连接失败' })
    } catch {
      return JSON.stringify({ action: 'testCloudConnection', success: false, message: '连接测试失败' })
    }
  },
})

export const triggerCloudSyncTool = new DynamicTool({
  name: 'trigger_cloud_sync',
  description: '触发云同步',
  func: async () => {
    try {
      await syncToCloud()
      const status = getSyncStatus()
      return JSON.stringify({ action: 'triggerCloudSync', success: true, status, message: '同步完成' })
    } catch (err: any) {
      return JSON.stringify({ action: 'triggerCloudSync', success: false, error: err.message })
    }
  },
})

export const getQueueStatusTool = new DynamicTool({
  name: 'get_queue_status',
  description: '获取AI请求队列状态',
  func: async () => {
    try {
      return JSON.stringify({
        action: 'getQueueStatus',
        message: '请求队列状态已获取',
        note: '队列状态为运行时数据，需通过事件监听获取',
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== Phase 11: 崩溃恢复与插件 ====================

export const checkCrashRecoveryTool = new DynamicTool({
  name: 'check_crash_recovery',
  description: '检查是否有崩溃恢复数据',
  func: async () => {
    try {
      const has = await hasCrashRecoveryData()
      const data = has ? await getCrashRecoveryData() : null
      return JSON.stringify({
        action: 'checkCrashRecovery',
        hasData: has,
        docId: data?.lastDocId || null,
        timestamp: data?.timestamp || null,
        date: data?.timestamp ? new Date(data.timestamp).toLocaleString('zh-CN') : null,
        message: has ? '发现崩溃恢复数据' : '无崩溃恢复数据',
      })
    } catch {
      return JSON.stringify({ error: '检查崩溃恢复数据失败' })
    }
  },
})

export const clearCrashDataTool = new DynamicTool({
  name: 'clear_crash_data',
  description: '清除崩溃恢复数据',
  func: async () => {
    try {
      await clearCrashRecoveryData()
      return JSON.stringify({ action: 'clearCrashData', message: '崩溃恢复数据已清除' })
    } catch {
      return JSON.stringify({ error: '清除崩溃恢复数据失败' })
    }
  },
})

export const listPluginsTool = new DynamicTool({
  name: 'list_plugins',
  description: '列出所有已注册的插件',
  func: async () => {
    try {
      const plugins = getAllPlugins()
      return JSON.stringify({
        action: 'listPlugins',
        total: plugins.length,
        plugins: plugins.map((p) => ({
          id: p.id,
          name: p.name,
          version: p.version,
          description: p.description,
          enabled: p.enabled,
        })),
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const togglePluginTool = new DynamicTool({
  name: 'toggle_plugin',
  description: '启用或禁用插件。参数: pluginId(插件ID), enabled(是否启用)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.pluginId) return JSON.stringify({ error: '缺少pluginId参数' })
    
    const plugin = getPlugin(args.pluginId)
    if (!plugin) return JSON.stringify({ error: `插件不存在: ${args.pluginId}` })

    if (args.enabled) {
      enablePlugin(args.pluginId)
    } else {
      disablePlugin(args.pluginId)
    }
    return JSON.stringify({
      action: 'togglePlugin',
      pluginId: args.pluginId,
      enabled: args.enabled,
      message: `插件「${plugin.name}」已${args.enabled ? '启用' : '禁用'}`,
    })
  },
})

// ==================== Phase 12: 文件导入 ====================

export const importFileTool = new DynamicTool({
  name: 'import_file',
  description: '从内容创建新文档（模拟文件导入）。参数: title(文档标题), content(文件内容), format(txt/md/json)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.title) return JSON.stringify({ error: '缺少title参数' })
    if (!args.content) return JSON.stringify({ error: '缺少content参数' })

    const format = (args.format || 'txt').toLowerCase()
    let tiptapContent: object

    if (format === 'json') {
      try {
        const data = JSON.parse(args.content)
        if (data.content && data.content.type === 'doc') {
          tiptapContent = data.content
        } else {
          tiptapContent = {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: args.content }] }],
          }
        }
      } catch {
        tiptapContent = {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: args.content }] }],
        }
      }
    } else if (format === 'md' || format === 'markdown') {
      const blocks: any[] = []
      const lines = args.content.split('\n')
      for (const line of lines) {
        if (line.startsWith('# ')) {
          blocks.push({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: line.slice(2) }] })
        } else if (line.startsWith('## ')) {
          blocks.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: line.slice(3) }] })
        } else if (line.startsWith('### ')) {
          blocks.push({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: line.slice(4) }] })
        } else if (line.startsWith('> ')) {
          blocks.push({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: line.slice(2) }] }] })
        } else if (line.trim() === '') {
          continue
        } else {
          blocks.push({ type: 'paragraph', content: [{ type: 'text', text: line }] })
        }
      }
      tiptapContent = { type: 'doc', content: blocks.length > 0 ? blocks : [{ type: 'paragraph' }] }
    } else {
      tiptapContent = {
        type: 'doc',
        content: args.content.split('\n').map((line: string) => ({
          type: 'paragraph',
          content: [{ type: 'text', text: line }],
        })),
      }
    }

    const docId = await useDocumentStore.getState().addDoc({
      title: args.title,
      type: 'chapter',
      content: tiptapContent,
      parentId: null,
    })
    useTabStore.getState().openTab(docId, args.title)
    useDocumentStore.getState().setCurrentDoc(docId)

    return JSON.stringify({
      action: 'importFile',
      docId,
      title: args.title,
      format,
      message: `已导入文件「${args.title}」`,
    })
  },
})

// ==================== Phase 13: UI控制补充 ====================

export const toggleTypewriterModeTool = new DynamicTool({
  name: 'toggle_typewriter_mode',
  description: '切换打字机模式',
  func: async () => {
    try {
      useUIStore.getState().toggleTypewriterMode()
      const isOn = useUIStore.getState().typewriterMode
      return JSON.stringify({ action: 'toggleTypewriterMode', enabled: isOn, message: isOn ? '已开启打字机模式' : '已关闭打字机模式' })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const toggleFullscreenTool = new DynamicTool({
  name: 'toggle_fullscreen',
  description: '切换全屏模式',
  func: async () => {
    try {
      useUIStore.getState().toggleFullscreen()
      const isOn = useUIStore.getState().fullscreen
      return JSON.stringify({ action: 'toggleFullscreen', enabled: isOn, message: isOn ? '已进入全屏' : '已退出全屏' })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const repairDocumentTool = new DynamicTool({
  name: 'repair_document',
  description: '修复损坏的文档结构。参数: docId(可选,不传则修复当前文档)',
  func: async (input: string) => {
    const args = JSON.parse(input || '{}')
    try {
      const { documents, getCurrentDoc, updateDoc } = useDocumentStore.getState()
      const doc = args.docId ? documents?.find((d) => d.id === args.docId) : getCurrentDoc?.()
      if (!doc) return JSON.stringify({ error: '文档不存在' })

      const repaired = repairDocument(doc)
      if (!repaired) return JSON.stringify({ error: '文档无法修复' })

      updateDoc(doc.id, { content: repaired.content })
      return JSON.stringify({
        action: 'repairDocument',
        docId: doc.id,
        title: doc.title,
        message: `文档「${doc.title}」已修复`,
      })
    } catch {
      return JSON.stringify({ error: '修复文档失败' })
    }
  },
})

// ==================== Phase 14: 协作操作补充 ====================

export const collaborationConnectTool = new DynamicTool({
  name: 'collaboration_connect',
  description: '连接到协作服务器。参数: server(服务器地址)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      return JSON.stringify({
        action: 'collaborationConnect',
        server: args.server || 'default',
        message: '协作连接请求已发送',
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const collaborationDisconnectTool = new DynamicTool({
  name: 'collaboration_disconnect',
  description: '断开协作连接',
  func: async () => {
    try {
      return JSON.stringify({ action: 'collaborationDisconnect', message: '已断开协作连接' })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== Phase 15: 快捷键管理 ====================

export const listShortcutsTool = new DynamicTool({
  name: 'list_shortcuts',
  description: '列出所有快捷键绑定',
  func: async () => {
    try {
      const { shortcuts } = useShortcutStore.getState()
      return JSON.stringify({
        action: 'listShortcuts',
        total: shortcuts.length,
        shortcuts: shortcuts.map((s) => ({
          id: s.id,
          label: s.label,
          code: s.code,
          key: s.key,
          ctrl: s.ctrl,
          shift: s.shift,
          alt: s.alt,
        })),
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const updateShortcutTool = new DynamicTool({
  name: 'update_shortcut',
  description: '更新快捷键绑定。参数: shortcutId(快捷键ID), key(新按键), ctrl, shift, alt',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.shortcutId) return JSON.stringify({ error: '缺少shortcutId参数' })
    if (!args.key) return JSON.stringify({ error: '缺少key参数' })

    const { updateShortcut, shortcuts } = useShortcutStore.getState()
    const shortcut = shortcuts.find((s) => s.id === args.shortcutId)
    if (!shortcut) return JSON.stringify({ error: `快捷键不存在: ${args.shortcutId}` })

    updateShortcut(args.shortcutId, {
      key: args.key,
      ctrl: args.ctrl,
      shift: args.shift,
      alt: args.alt,
    })
    const updated = useShortcutStore.getState().shortcuts.find((s) => s.id === args.shortcutId)
    return JSON.stringify({
      action: 'updateShortcut',
      shortcutId: args.shortcutId,
      newCode: updated?.code,
      message: `快捷键「${shortcut.label}」已更新为 ${updated?.code}`,
    })
  },
})

export const resetShortcutTool = new DynamicTool({
  name: 'reset_shortcut',
  description: '重置快捷键为默认值。参数: shortcutId(快捷键ID)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.shortcutId) return JSON.stringify({ error: '缺少shortcutId参数' })

    const { resetShortcut, shortcuts } = useShortcutStore.getState()
    const shortcut = shortcuts.find((s) => s.id === args.shortcutId)
    if (!shortcut) return JSON.stringify({ error: `快捷键不存在: ${args.shortcutId}` })

    resetShortcut(args.shortcutId)
    return JSON.stringify({ action: 'resetShortcut', shortcutId: args.shortcutId, message: `快捷键「${shortcut.label}」已重置` })
  },
})

export const findShortcutConflictsTool = new DynamicTool({
  name: 'find_shortcut_conflicts',
  description: '检测快捷键冲突。参数: shortcutId, key, ctrl, shift, alt',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.shortcutId || !args.key) return JSON.stringify({ error: '缺少参数' })

    const { findConflicts } = useShortcutStore.getState()
    const conflicts = findConflicts(args.shortcutId, args.key, args.ctrl, args.shift, args.alt)
    return JSON.stringify({
      action: 'findShortcutConflicts',
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map((c) => ({ id: c.id, label: c.label, code: c.code })),
      message: conflicts.length === 0 ? '无冲突' : `发现 ${conflicts.length} 个冲突`,
    })
  },
})

// ==================== Phase 16: 文档会话与字数 ====================

export const getCursorPositionTool = new DynamicTool({
  name: 'get_cursor_position',
  description: '获取当前文档的光标位置',
  func: async () => {
    try {
      const { getCurrentDoc } = useDocumentStore.getState()
      const doc = getCurrentDoc?.()
      if (!doc) return JSON.stringify({ error: '没有打开的文档' })

      const position = useDocumentSessionStore.getState().getCursorPosition(doc.id)
      return JSON.stringify({ action: 'getCursorPosition', docId: doc.id, position, message: `光标位置: ${position ?? '未知'}` })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const getScrollPositionTool = new DynamicTool({
  name: 'get_scroll_position',
  description: '获取当前文档的滚动位置',
  func: async () => {
    try {
      const { getCurrentDoc } = useDocumentStore.getState()
      const doc = getCurrentDoc?.()
      if (!doc) return JSON.stringify({ error: '没有打开的文档' })

      const position = useDocumentSessionStore.getState().getScrollPosition(doc.id)
      return JSON.stringify({ action: 'getScrollPosition', docId: doc.id, position, message: `滚动位置: ${position}` })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const clearUndoHistoryTool = new DynamicTool({
  name: 'clear_undo_history',
  description: '清除指定文档的撤销/重做历史',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input || '{}')
      const { getCurrentDoc } = useDocumentStore.getState()
      const doc = args.docId ? useDocumentStore.getState().documents?.find((d) => d.id === args.docId) : getCurrentDoc?.()
      if (!doc) return JSON.stringify({ error: '文档不存在' })

      useDocumentSessionStore.getState().clearHistory(doc.id)
      return JSON.stringify({ action: 'clearUndoHistory', docId: doc.id, message: `文档「${doc.title}」的撤销历史已清除` })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const getTotalWordCountTool = new DynamicTool({
  name: 'get_total_word_count',
  description: '获取持久化的累计字数统计',
  func: async () => {
    try {
      const { currentCount, totalCount } = useWordCountStore.getState()
      return JSON.stringify({
        action: 'getTotalWordCount',
        currentCount,
        totalCount,
        message: `当前字数: ${currentCount}, 累计字数: ${totalCount}`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== Phase 17: 评论补充 ====================

export const resolveCommentTool = new DynamicTool({
  name: 'resolve_comment',
  description: '标记评论为已解决。参数: commentId(评论ID)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.commentId) return JSON.stringify({ error: '缺少commentId参数' })

    const { comments, resolveComment } = useCommentStore.getState()
    const comment = comments.find((c) => c.id === args.commentId)
    if (!comment) return JSON.stringify({ error: `评论不存在: ${args.commentId}` })

    resolveComment(args.commentId)
    return JSON.stringify({ action: 'resolveComment', commentId: args.commentId, resolved: !comment.resolved, message: `评论已${comment.resolved ? '重新打开' : '标记为已解决'}` })
  },
})

export const deleteCommentTool = new DynamicTool({
  name: 'delete_comment',
  description: '删除评论。参数: commentId(评论ID)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.commentId) return JSON.stringify({ error: '缺少commentId参数' })

    const { comments, deleteComment } = useCommentStore.getState()
    const comment = comments.find((c) => c.id === args.commentId)
    if (!comment) return JSON.stringify({ error: `评论不存在: ${args.commentId}` })

    deleteComment(args.commentId)
    return JSON.stringify({ action: 'deleteComment', commentId: args.commentId, message: '评论已删除' })
  },
})

export const addReplyTool = new DynamicTool({
  name: 'add_reply',
  description: '为评论添加回复。参数: commentId(评论ID), content(回复内容), author(作者,可选)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.commentId) return JSON.stringify({ error: '缺少commentId参数' })
    if (!args.content) return JSON.stringify({ error: '缺少content参数' })

    const { comments, addReply } = useCommentStore.getState()
    const comment = comments.find((c) => c.id === args.commentId)
    if (!comment) return JSON.stringify({ error: `评论不存在: ${args.commentId}` })

    addReply(args.commentId, {
      author: args.author || 'AI Agent',
      content: args.content,
    })
    return JSON.stringify({ action: 'addReply', commentId: args.commentId, message: '回复已添加' })
  },
})

// ==================== Phase 18: UI/文件夹补充 ====================

export const setFocusToolbarModeTool = new DynamicTool({
  name: 'set_focus_toolbar_mode',
  description: '设置专注模式工具栏显示方式。参数: mode(auto/always/never)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.mode || !['auto', 'always', 'never'].includes(args.mode)) {
      return JSON.stringify({ error: 'mode必须为auto/always/never' })
    }
    useUIStore.getState().setFocusToolbarMode(args.mode)
    return JSON.stringify({ action: 'setFocusToolbarMode', mode: args.mode, message: `工具栏模式已设为 ${args.mode}` })
  },
})

export const getUIStateTool = new DynamicTool({
  name: 'get_ui_state',
  description: '获取当前UI状态',
  func: async () => {
    try {
      const state = useUIStore.getState()
      return JSON.stringify({
        action: 'getUIState',
        focusMode: state.focusMode,
        typewriterMode: state.typewriterMode,
        fullscreen: state.fullscreen,
        sidebarOpen: state.sidebarOpen,
        aiPanelOpen: state.aiPanelOpen,
        focusToolbarMode: state.focusToolbarMode,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const renameFolderTool = new DynamicTool({
  name: 'rename_folder',
  description: '重命名文件夹。参数: folderId(文件夹ID), name(新名称)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.folderId) return JSON.stringify({ error: '缺少folderId参数' })
    if (!args.name) return JSON.stringify({ error: '缺少name参数' })

    const { folders, renameFolder } = useDocumentStore.getState()
    const folder = folders.find((f) => f.id === args.folderId)
    if (!folder) return JSON.stringify({ error: `文件夹不存在: ${args.folderId}` })

    renameFolder(args.folderId, args.name)
    return JSON.stringify({ action: 'renameFolder', folderId: args.folderId, name: args.name, message: `文件夹已重命名为「${args.name}」` })
  },
})

export const removeFolderTool = new DynamicTool({
  name: 'remove_folder',
  description: '删除文件夹（内含文档将移至根目录）。参数: folderId(文件夹ID)',
  func: async (input: string) => {
    const args = JSON.parse(input)
    if (!args.folderId) return JSON.stringify({ error: '缺少folderId参数' })

    const { folders, removeFolder } = useDocumentStore.getState()
    const folder = folders.find((f) => f.id === args.folderId)
    if (!folder) return JSON.stringify({ error: `文件夹不存在: ${args.folderId}` })

    removeFolder(args.folderId)
    return JSON.stringify({ action: 'removeFolder', folderId: args.folderId, message: `文件夹「${folder.name}」已删除` })
  },
})

// ==================== Phase 19: 动态UI与交互 ====================

export const createDialogTool = new DynamicTool({
  name: 'create_dialog',
  description: '动态创建对话框并显示。参数: title(标题), content(内容), type(info/confirm/prompt), options(选项数组,可选)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.title) return JSON.stringify({ error: '缺少title参数' })

      const dialogType = args.type || 'info'
      const dialog = document.createElement('div')
      dialog.className = 'ai-agent-dialog'
      dialog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg-primary,#fff);border:1px solid var(--border,#ccc);border-radius:8px;padding:20px;z-index:10000;min-width:300px;max-width:500px;box-shadow:0 4px 20px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;'

      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;'
      overlay.addEventListener('click', () => { dialog.remove(); overlay.remove() })

      let resultValue: string | null = null

      const titleEl = document.createElement('h3')
      titleEl.textContent = args.title
      titleEl.style.cssText = 'margin:0 0 12px 0;font-size:16px;color:var(--text-primary,#333);'
      dialog.appendChild(titleEl)

      if (args.content) {
        const contentEl = document.createElement('p')
        contentEl.textContent = args.content
        contentEl.style.cssText = 'margin:0 0 16px 0;color:var(--text-secondary,#666);line-height:1.5;'
        dialog.appendChild(contentEl)
      }

      if (dialogType === 'prompt') {
        const inputEl = document.createElement('input')
        inputEl.type = 'text'
        inputEl.style.cssText = 'width:100%;padding:8px 12px;border:1px solid var(--border,#ccc);border-radius:4px;margin-bottom:16px;box-sizing:border-box;'
        dialog.appendChild(inputEl)
        setTimeout(() => inputEl.focus(), 100)
        resultValue = ''
        inputEl.addEventListener('input', () => { resultValue = inputEl.value })
      }

      if (args.options && Array.isArray(args.options)) {
        const optionsContainer = document.createElement('div')
        optionsContainer.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;'
        for (const opt of args.options) {
          const btn = document.createElement('button')
          btn.textContent = opt.label || opt.value || String(opt)
          btn.style.cssText = 'padding:6px 16px;border:1px solid var(--border,#ccc);border-radius:4px;cursor:pointer;background:var(--bg-secondary,#f5f5f5);'
          btn.addEventListener('click', () => {
            resultValue = opt.value || opt.label || String(opt)
            dialog.remove(); overlay.remove()
            window.dispatchEvent(new CustomEvent('ai-dialog-result', { detail: { title: args.title, value: resultValue } }))
          })
          optionsContainer.appendChild(btn)
        }
        dialog.appendChild(optionsContainer)
      } else {
        const btnContainer = document.createElement('div')
        btnContainer.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;'
        const closeBtn = document.createElement('button')
        closeBtn.textContent = dialogType === 'confirm' ? '取消' : '关闭'
        closeBtn.style.cssText = 'padding:6px 16px;border:1px solid var(--border,#ccc);border-radius:4px;cursor:pointer;background:var(--bg-secondary,#f5f5f5);'
        closeBtn.addEventListener('click', () => { dialog.remove(); overlay.remove() })
        btnContainer.appendChild(closeBtn)

        if (dialogType === 'confirm') {
          const okBtn = document.createElement('button')
          okBtn.textContent = '确认'
          okBtn.style.cssText = 'padding:6px 16px;border:none;border-radius:4px;cursor:pointer;background:var(--accent,#4a90d9);color:#fff;'
          okBtn.addEventListener('click', () => {
            resultValue = 'confirmed'
            dialog.remove(); overlay.remove()
            window.dispatchEvent(new CustomEvent('ai-dialog-result', { detail: { title: args.title, value: 'confirmed' } }))
          })
          btnContainer.appendChild(okBtn)
        }
        dialog.appendChild(btnContainer)
      }

      document.body.appendChild(overlay)
      document.body.appendChild(dialog)

      return JSON.stringify({
        action: 'createDialog',
        type: dialogType,
        title: args.title,
        message: `对话框「${args.title}」已显示`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

export const simulateClickTool = new DynamicTool({
  name: 'simulate_click',
  description: '模拟鼠标点击。参数: selector(CSS选择器), button(left/right/middle)',
  func: async (input: string) => {
    try {
      const args = JSON.parse(input)
      if (!args.selector) return JSON.stringify({ error: '缺少selector参数' })

      const element = document.querySelector(args.selector)
      if (!element) return JSON.stringify({ error: `元素不存在: ${args.selector}` })

      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const eventOpts = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: centerX,
        clientY: centerY,
        button: args.button === 'right' ? 2 : args.button === 'middle' ? 1 : 0,
      }

      element.dispatchEvent(new MouseEvent('mousedown', eventOpts))
      element.dispatchEvent(new MouseEvent('mouseup', eventOpts))
      element.dispatchEvent(new MouseEvent('click', eventOpts))

      return JSON.stringify({
        action: 'simulateClick',
        selector: args.selector,
        x: Math.round(centerX),
        y: Math.round(centerY),
        button: args.button || 'left',
        message: `已点击元素「${args.selector}」`,
      })
    } catch (err) {
      return JSON.stringify({ action: 'error', error: (err as Error).message })
    }
  },
})

// ==================== 导出 ====================

export const allLangChainTools = [
  // Phase 1
  insertTextTool,
  replaceTextTool,
  readDocumentTool,
  readOutlineTool,
  searchWebTool,
  getWordCountTool,
  createDocumentTool,
  suggestEditTool,
  formatTextTool,
  findInDocumentTool,
  replaceInDocumentTool,
  deleteDocumentTool,
  renameDocumentTool,
  moveDocumentTool,
  createFolderTool,
  // Phase 2
  openTabTool,
  closeTabTool,
  listTabsTool,
  switchTabTool,
  undoTool,
  redoTool,
  // Phase 3
  createCodeBlockTool,
  addCommentTool,
  listCommentsTool,
  createVersionTool,
  listVersionsTool,
  restoreVersionTool,
  getWritingStatsTool,
  // Phase 4
  setWordGoalTool,
  getWordGoalProgressTool,
  // Phase 5
  toggleThemeTool,
  toggleWordWrapTool,
  toggleSidebarTool,
  toggleFocusModeTool,
  toggleAIPanelTool,
  // Phase 6
  getCollaborationStatusTool,
  toggleAutoSaveTool,
  setAutoSaveStrategyTool,
  setAutoSaveIntervalTool,
  toggleHighContrastTool,
  setCustomThemeTool,
  getDocumentCacheStatsTool,
  clearDocumentCacheTool,
  // Phase 7
  searchAllDocumentsTool,
  getDocumentTreeTool,
  exportDocumentTool,
  batchExportTool,
  saveDocumentTool,
  triggerShortcutTool,
  spellCheckTool,
  // Phase 8
  updateDocumentMetadataTool,
  editOutlineTool,
  editorToMarkdownTool,
  markdownToEditorTool,
  createBackupTool,
  restoreBackupTool,
  listBackupsTool,
  validateDocumentTool,
  // Phase 9
  showToastTool,
  preExportProcessTool,
  openPanelTool,
  // Phase 10
  getAIConfigTool,
  setAIConfigTool,
  clearAIConfigTool,
  getCloudConfigTool,
  setCloudConfigTool,
  testCloudConnectionTool,
  triggerCloudSyncTool,
  getQueueStatusTool,
  // Phase 11
  checkCrashRecoveryTool,
  clearCrashDataTool,
  listPluginsTool,
  togglePluginTool,
  // Phase 12
  importFileTool,
  // Phase 13
  toggleTypewriterModeTool,
  toggleFullscreenTool,
  repairDocumentTool,
  // Phase 14
  collaborationConnectTool,
  collaborationDisconnectTool,
  // Phase 15
  listShortcutsTool,
  updateShortcutTool,
  resetShortcutTool,
  findShortcutConflictsTool,
  // Phase 16
  getCursorPositionTool,
  getScrollPositionTool,
  clearUndoHistoryTool,
  getTotalWordCountTool,
  // Phase 17
  resolveCommentTool,
  deleteCommentTool,
  addReplyTool,
  // Phase 18
  setFocusToolbarModeTool,
  getUIStateTool,
  renameFolderTool,
  removeFolderTool,
  // Phase 19
  createDialogTool,
  simulateClickTool,
]

const TOOLS_NEEDING_REVIEW = [
  'insert_text', 
  'replace_text', 
  'create_document', 
  'suggest_edit',
  'delete_document',
  'restore_version',
  'restore_backup',
  'batch_export',
  'markdown_to_editor',
]

export function needsReview(toolName: string): boolean {
  return TOOLS_NEEDING_REVIEW.includes(toolName)
}

export function getToolByName(name: string) {
  return allLangChainTools.find((t) => t.name === name)
}

export const openAITools = [
  // Phase 1
  {
    type: 'function' as const,
    function: {
      name: 'insert_text',
      description: '在编辑器指定位置插入文本',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要插入的文本' },
          position: { type: 'number', description: '插入位置,-1表示当前光标' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'replace_text',
      description: '替换编辑器中选中的文本',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '替换后的文本' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'read_document',
      description: '读取文档内容(不传参数读取当前文档)',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID(可选,不传则读取当前文档)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'read_outline',
      description: '读取文档的大纲结构（标题列表）',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_word_count',
      description: '获取当前文档的字数统计',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_web',
      description: '搜索网络获取信息',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_document',
      description: '创建新文档并打开',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '文档标题' },
          content: { type: 'string', description: '初始内容(可选)' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'suggest_edit',
      description: '建议编辑内容（需要用户确认后执行）',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: '修改说明' },
          after: { type: 'string', description: '修改后的内容' },
        },
        required: ['description', 'after'],
      },
    },
  },
  // Phase 1 新增
  {
    type: 'function' as const,
    function: {
      name: 'format_text',
      description: '格式化选中文本',
      parameters: {
        type: 'object',
        properties: {
          format: { 
            type: 'string', 
            description: '格式类型: bold, italic, underline, strike, heading1, heading2, heading3, bulletList, orderedList, blockquote, codeBlock, highlight, clear' 
          },
          value: { type: 'string', description: '可选值(如heading的level)' },
        },
        required: ['format'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_in_document',
      description: '在文档中搜索文本',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          useRegex: { type: 'boolean', description: '是否使用正则表达式' },
          caseSensitive: { type: 'boolean', description: '是否区分大小写' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'replace_in_document',
      description: '在文档中替换文本',
      parameters: {
        type: 'object',
        properties: {
          find: { type: 'string', description: '查找文本' },
          replace: { type: 'string', description: '替换文本' },
          replaceAll: { type: 'boolean', description: '是否全部替换' },
        },
        required: ['find', 'replace'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_document',
      description: '删除指定文档(需要确认)',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID' },
          confirm: { type: 'boolean', description: '确认删除(必须为true)' },
        },
        required: ['docId', 'confirm'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'rename_document',
      description: '重命名文档',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID' },
          newTitle: { type: 'string', description: '新标题' },
        },
        required: ['docId', 'newTitle'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'move_document',
      description: '移动文档到文件夹',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID' },
          folderId: { type: 'string', description: '目标文件夹ID(null表示根目录)' },
        },
        required: ['docId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_folder',
      description: '创建文件夹',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '文件夹名称' },
          parentId: { type: 'string', description: '父文件夹ID(可选)' },
        },
        required: ['name'],
      },
    },
  },
  // Phase 2
  {
    type: 'function' as const,
    function: {
      name: 'open_tab',
      description: '打开文档的标签页',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID' },
        },
        required: ['docId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'close_tab',
      description: '关闭文档标签页',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID' },
        },
        required: ['docId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_tabs',
      description: '列出当前打开的所有标签页',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'switch_tab',
      description: '切换到指定标签页',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID' },
        },
        required: ['docId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'undo',
      description: '执行撤销操作',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'redo',
      description: '执行重做操作',
      parameters: { type: 'object', properties: {} },
    },
  },
  // Phase 3
  {
    type: 'function' as const,
    function: {
      name: 'create_code_block',
      description: '创建代码块',
      parameters: {
        type: 'object',
        properties: {
          language: { type: 'string', description: '编程语言(如javascript, python)' },
          code: { type: 'string', description: '初始代码(可选)' },
        },
        required: ['language'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_comment',
      description: '为选中文本添加评论',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '评论内容' },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_version',
      description: '创建当前文档的版本快照',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_versions',
      description: '列出当前文档的所有版本',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'restore_version',
      description: '恢复到指定版本(需要确认)',
      parameters: {
        type: 'object',
        properties: {
          versionId: { type: 'string', description: '版本ID' },
        },
        required: ['versionId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_writing_stats',
      description: '获取写作统计数据',
      parameters: { type: 'object', properties: {} },
    },
  },
  // Phase 4
  {
    type: 'function' as const,
    function: {
      name: 'set_word_goal',
      description: '设置字数目标',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: '目标类型: daily(每日), chapter(章节), novel(小说)' },
          goal: { type: 'number', description: '目标字数' },
        },
        required: ['type', 'goal'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_word_goal_progress',
      description: '获取字数目标进度',
      parameters: { type: 'object', properties: {} },
    },
  },
  // Phase 5
  {
    type: 'function' as const,
    function: {
      name: 'toggle_theme',
      description: '切换深色/浅色主题',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_word_wrap',
      description: '切换自动换行',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_sidebar',
      description: '切换侧边栏显示',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_focus_mode',
      description: '切换专注模式',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_ai_panel',
      description: '切换AI面板显示',
      parameters: { type: 'object', properties: {} },
    },
  },
  // Phase 6
  {
    type: 'function' as const,
    function: {
      name: 'get_collaboration_status',
      description: '获取协作状态信息',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_auto_save',
      description: '切换自动保存功能',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_auto_save_strategy',
      description: '设置自动保存策略',
      parameters: {
        type: 'object',
        properties: {
          strategy: { type: 'string', description: '保存策略: auto(自动), manual(手动), smart(智能)' },
        },
        required: ['strategy'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_auto_save_interval',
      description: '设置自动保存间隔',
      parameters: {
        type: 'object',
        properties: {
          interval: { type: 'number', description: '间隔时间(毫秒)' },
        },
        required: ['interval'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_high_contrast',
      description: '切换高对比度模式',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_custom_theme',
      description: '设置自定义主题颜色',
      parameters: {
        type: 'object',
        properties: {
          preset: { type: 'string', description: '预设名称(如 reset 重置为默认)' },
          colors: { type: 'object', description: '自定义颜色对象' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_document_cache_stats',
      description: '获取文档缓存统计信息',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'clear_document_cache',
      description: '清空文档缓存',
      parameters: { type: 'object', properties: {} },
    },
  },
  // Phase 7
  {
    type: 'function' as const,
    function: {
      name: 'search_all_documents',
      description: '跨文档搜索内容',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          useRegex: { type: 'boolean', description: '是否使用正则表达式' },
          caseSensitive: { type: 'boolean', description: '是否区分大小写' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_document_tree',
      description: '获取项目文档树的完整结构',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'export_document',
      description: '导出文档为指定格式',
      parameters: {
        type: 'object',
        properties: {
          format: { type: 'string', description: '导出格式: markdown/docx/pdf/html/txt/epub/latex/rtf' },
          docId: { type: 'string', description: '文档ID(可选)' },
        },
        required: ['format'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'batch_export',
      description: '批量导出所有文档',
      parameters: {
        type: 'object',
        properties: {
          format: { type: 'string', description: '导出格式: markdown/docx/pdf/html/txt' },
        },
        required: ['format'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'save_document',
      description: '立即保存所有文档',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'trigger_shortcut',
      description: '触发键盘快捷键',
      parameters: {
        type: 'object',
        properties: {
          shortcutId: { type: 'string', description: '快捷键ID(如 save/bold/italic/undo/redo/findReplace)' },
        },
        required: ['shortcutId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'spell_check',
      description: '对文档进行拼写和语法检查',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID(可选)' },
        },
      },
    },
  },
  // Phase 8
  {
    type: 'function' as const,
    function: {
      name: 'update_document_metadata',
      description: '修改文档元数据',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID' },
          type: { type: 'string', description: '新类型: chapter/scene/character/code_snippet' },
          parentId: { type: 'string', description: '新父文档ID' },
        },
        required: ['docId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'edit_outline',
      description: '修改文档大纲',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: '操作: add/addAfter/remove' },
          level: { type: 'number', description: '标题级别(1-3)' },
          text: { type: 'string', description: '标题文本' },
          insertAfterText: { type: 'string', description: '插入位置的标题文本' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'editor_to_markdown',
      description: '将当前文档转换为Markdown格式',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'markdown_to_editor',
      description: '将Markdown文本转换为编辑器格式并插入',
      parameters: {
        type: 'object',
        properties: {
          markdown: { type: 'string', description: 'Markdown文本' },
        },
        required: ['markdown'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_backup',
      description: '创建当前所有文档的备份',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'restore_backup',
      description: '恢复备份',
      parameters: {
        type: 'object',
        properties: {
          backupId: { type: 'string', description: '备份ID(可选,不传则恢复最近备份)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_backups',
      description: '列出所有可用备份',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'validate_document',
      description: '验证文档结构是否有效',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID(可选)' },
        },
      },
    },
  },
  // Phase 9
  {
    type: 'function' as const,
    function: {
      name: 'show_toast',
      description: '显示通知消息',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: '消息内容' },
          type: { type: 'string', description: '类型: info/success/error/warning' },
        },
        required: ['message'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'pre_export_process',
      description: '在导出前进行AI预处理',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: '操作: summarize/reformat/clean' },
          docId: { type: 'string', description: '文档ID(可选)' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'open_panel',
      description: '打开指定面板',
      parameters: {
        type: 'object',
        properties: {
          panel: { type: 'string', description: '面板名称: findReplace/settings/versionHistory/writingStats/outline/wordCount/keyboardShortcuts/backup/templates' },
        },
        required: ['panel'],
      },
    },
  },
  // Phase 10
  {
    type: 'function' as const,
    function: {
      name: 'get_ai_config',
      description: '获取当前AI配置',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_ai_config',
      description: '设置AI配置',
      parameters: {
        type: 'object',
        properties: {
          provider: { type: 'string', description: 'AI提供商: openai/anthropic/custom' },
          apiKey: { type: 'string', description: 'API密钥' },
          baseUrl: { type: 'string', description: 'API地址' },
          model: { type: 'string', description: '模型名称' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'clear_ai_config',
      description: '清除AI配置',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_cloud_config',
      description: '获取云同步配置和状态',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_cloud_config',
      description: '设置云同步配置',
      parameters: {
        type: 'object',
        properties: {
          provider: { type: 'string', description: '云服务商: webdav/github/gitee' },
          server: { type: 'string', description: 'WebDAV服务器地址' },
          token: { type: 'string', description: 'GitHub/Gitee token' },
          repo: { type: 'string', description: '仓库名' },
          path: { type: 'string', description: '路径' },
        },
        required: ['provider'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'test_cloud_connection',
      description: '测试云同步连接',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'trigger_cloud_sync',
      description: '触发云同步',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_queue_status',
      description: '获取AI请求队列状态',
      parameters: { type: 'object', properties: {} },
    },
  },
  // Phase 11
  {
    type: 'function' as const,
    function: {
      name: 'check_crash_recovery',
      description: '检查崩溃恢复数据',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'clear_crash_data',
      description: '清除崩溃恢复数据',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_plugins',
      description: '列出所有插件',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_plugin',
      description: '启用或禁用插件',
      parameters: {
        type: 'object',
        properties: {
          pluginId: { type: 'string', description: '插件ID' },
          enabled: { type: 'boolean', description: '是否启用' },
        },
        required: ['pluginId', 'enabled'],
      },
    },
  },
  // Phase 12
  {
    type: 'function' as const,
    function: {
      name: 'import_file',
      description: '从内容创建新文档（模拟文件导入）',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '文档标题' },
          content: { type: 'string', description: '文件内容' },
          format: { type: 'string', description: '格式: txt/md/json' },
        },
        required: ['title', 'content'],
      },
    },
  },
  // Phase 13
  {
    type: 'function' as const,
    function: {
      name: 'toggle_typewriter_mode',
      description: '切换打字机模式',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_fullscreen',
      description: '切换全屏模式',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'repair_document',
      description: '修复损坏的文档结构',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID(可选)' },
        },
      },
    },
  },
  // Phase 14
  {
    type: 'function' as const,
    function: {
      name: 'collaboration_connect',
      description: '连接协作服务器',
      parameters: {
        type: 'object',
        properties: {
          server: { type: 'string', description: '服务器地址' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'collaboration_disconnect',
      description: '断开协作连接',
      parameters: { type: 'object', properties: {} },
    },
  },
  // Phase 15
  {
    type: 'function' as const,
    function: {
      name: 'list_shortcuts',
      description: '列出所有快捷键绑定',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_shortcut',
      description: '更新快捷键绑定',
      parameters: {
        type: 'object',
        properties: {
          shortcutId: { type: 'string', description: '快捷键ID' },
          key: { type: 'string', description: '新按键' },
          ctrl: { type: 'boolean', description: '是否使用Ctrl' },
          shift: { type: 'boolean', description: '是否使用Shift' },
          alt: { type: 'boolean', description: '是否使用Alt' },
        },
        required: ['shortcutId', 'key'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reset_shortcut',
      description: '重置快捷键为默认值',
      parameters: {
        type: 'object',
        properties: {
          shortcutId: { type: 'string', description: '快捷键ID' },
        },
        required: ['shortcutId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_shortcut_conflicts',
      description: '检测快捷键冲突',
      parameters: {
        type: 'object',
        properties: {
          shortcutId: { type: 'string', description: '快捷键ID' },
          key: { type: 'string', description: '按键' },
          ctrl: { type: 'boolean' },
          shift: { type: 'boolean' },
          alt: { type: 'boolean' },
        },
        required: ['shortcutId', 'key'],
      },
    },
  },
  // Phase 16
  {
    type: 'function' as const,
    function: {
      name: 'get_cursor_position',
      description: '获取当前文档光标位置',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_scroll_position',
      description: '获取当前文档滚动位置',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'clear_undo_history',
      description: '清除文档撤销/重做历史',
      parameters: {
        type: 'object',
        properties: {
          docId: { type: 'string', description: '文档ID(可选)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_total_word_count',
      description: '获取持久化的累计字数统计',
      parameters: { type: 'object', properties: {} },
    },
  },
  // Phase 17
  {
    type: 'function' as const,
    function: {
      name: 'resolve_comment',
      description: '标记评论为已解决',
      parameters: {
        type: 'object',
        properties: {
          commentId: { type: 'string', description: '评论ID' },
        },
        required: ['commentId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_comment',
      description: '删除评论',
      parameters: {
        type: 'object',
        properties: {
          commentId: { type: 'string', description: '评论ID' },
        },
        required: ['commentId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_reply',
      description: '为评论添加回复',
      parameters: {
        type: 'object',
        properties: {
          commentId: { type: 'string', description: '评论ID' },
          content: { type: 'string', description: '回复内容' },
          author: { type: 'string', description: '作者(可选)' },
        },
        required: ['commentId', 'content'],
      },
    },
  },
  // Phase 18
  {
    type: 'function' as const,
    function: {
      name: 'set_focus_toolbar_mode',
      description: '设置专注模式工具栏显示方式',
      parameters: {
        type: 'object',
        properties: {
          mode: { type: 'string', description: '模式: auto/always/never' },
        },
        required: ['mode'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_ui_state',
      description: '获取当前UI状态',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'rename_folder',
      description: '重命名文件夹',
      parameters: {
        type: 'object',
        properties: {
          folderId: { type: 'string', description: '文件夹ID' },
          name: { type: 'string', description: '新名称' },
        },
        required: ['folderId', 'name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_folder',
      description: '删除文件夹（内含文档移至根目录）',
      parameters: {
        type: 'object',
        properties: {
          folderId: { type: 'string', description: '文件夹ID' },
        },
        required: ['folderId'],
      },
    },
  },
  // Phase 19
  {
    type: 'function' as const,
    function: {
      name: 'create_dialog',
      description: '动态创建对话框并显示',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '对话框标题' },
          content: { type: 'string', description: '对话框内容' },
          type: { type: 'string', description: '类型: info/confirm/prompt' },
          options: { type: 'array', description: '选项数组', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } } } },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'simulate_click',
      description: '模拟鼠标点击元素',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS选择器' },
          button: { type: 'string', description: '鼠标按键: left/right/middle' },
        },
        required: ['selector'],
      },
    },
  },
]
