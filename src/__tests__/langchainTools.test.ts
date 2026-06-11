import { describe, it, expect, beforeEach } from 'vitest'
import {
  insertTextTool,
  replaceTextTool,
  readDocumentTool,
  readOutlineTool,
  searchWebTool,
  getWordCountTool,
  createDocumentTool,
  suggestEditTool,
  setToolContext,
  getToolContext,
  needsReview,
  getToolByName,
  openAITools,
  allLangChainTools,
  searchAllDocumentsTool,
  getDocumentTreeTool,
  exportDocumentTool,
  batchExportTool,
  saveDocumentTool,
  triggerShortcutTool,
  spellCheckTool,
  updateDocumentMetadataTool,
  editOutlineTool,
  editorToMarkdownTool,
  markdownToEditorTool,
  createBackupTool,
  restoreBackupTool,
  listBackupsTool,
  validateDocumentTool,
  showToastTool,
  preExportProcessTool,
  openPanelTool,
  getAIConfigTool,
  setAIConfigTool,
  clearAIConfigTool,
  getCloudConfigTool,
  setCloudConfigTool,
  testCloudConnectionTool,
  triggerCloudSyncTool,
  getQueueStatusTool,
  checkCrashRecoveryTool,
  clearCrashDataTool,
  listPluginsTool,
  togglePluginTool,
  importFileTool,
  toggleTypewriterModeTool,
  toggleFullscreenTool,
  repairDocumentTool,
  collaborationConnectTool,
  collaborationDisconnectTool,
  listShortcutsTool,
  updateShortcutTool,
  resetShortcutTool,
  findShortcutConflictsTool,
  getCursorPositionTool,
  getScrollPositionTool,
  clearUndoHistoryTool,
  getTotalWordCountTool,
  resolveCommentTool,
  deleteCommentTool,
  addReplyTool,
  setFocusToolbarModeTool,
  getUIStateTool,
  renameFolderTool,
  removeFolderTool,
  createDialogTool,
  simulateClickTool,
} from '../services/agent/langchainTools'

describe('langchainTools', () => {
  beforeEach(() => {
    setToolContext({
      documentContent: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '第一章' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '这是正文内容。' }] },
        ],
      }),
      documentTitle: '测试文档',
      selection: '选中的文本',
      cursorPosition: 10,
    })
  })

  describe('setToolContext / getToolContext', () => {
    it('should set and get context', () => {
      setToolContext({ selection: '新选中' })
      const ctx = getToolContext()
      expect(ctx.selection).toBe('新选中')
      expect(ctx.documentTitle).toBe('测试文档')
    })

    it('should merge partial context', () => {
      setToolContext({ cursorPosition: 99 })
      const ctx = getToolContext()
      expect(ctx.cursorPosition).toBe(99)
      expect(ctx.documentTitle).toBe('测试文档')
    })
  })

  describe('insertTextTool', () => {
    it('should return insert action with text', async () => {
      const result = await insertTextTool.invoke(JSON.stringify({ text: '新段落', position: 5 }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('insert')
      expect(parsed.text).toBe('新段落')
      expect(parsed.position).toBe(5)
    })

    it('should default position to -1', async () => {
      const result = await insertTextTool.invoke(JSON.stringify({ text: '文本' }))
      const parsed = JSON.parse(result)
      expect(parsed.position).toBe(-1)
    })

    it('should handle invalid JSON', async () => {
      const result = await insertTextTool.invoke('not json')
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })
  })

  describe('replaceTextTool', () => {
    it('should return replace action with selection', async () => {
      const result = await replaceTextTool.invoke(JSON.stringify({ text: '替换后' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('replace')
      expect(parsed.original).toBe('选中的文本')
      expect(parsed.replacement).toBe('替换后')
    })

    it('should handle no selection', async () => {
      setToolContext({ selection: '' })
      const result = await replaceTextTool.invoke(JSON.stringify({ text: '替换' }))
      const parsed = JSON.parse(result)
      expect(parsed.original).toBe('(无选中文本)')
    })
  })

  describe('readDocumentTool', () => {
    it('should return document content as plain text', async () => {
      const result = await readDocumentTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.title).toBe('测试文档')
      expect(parsed.length).toBeGreaterThan(0)
      expect(parsed.preview).toContain('第一章')
    })

    it('should truncate at 2000 chars', async () => {
      const longContent = JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a'.repeat(3000) }] }],
      })
      setToolContext({ documentContent: longContent })
      const result = await readDocumentTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.preview.length).toBeLessThanOrEqual(2003)
      expect(parsed.preview).toContain('...')
    })
  })

  describe('readOutlineTool', () => {
    it('should extract headings', async () => {
      const result = await readOutlineTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.headings).toHaveLength(1)
      expect(parsed.headings[0].text).toBe('第一章')
      expect(parsed.headings[0].level).toBe(1)
    })

    it('should handle empty content', async () => {
      setToolContext({ documentContent: '{}' })
      const result = await readOutlineTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.headings).toHaveLength(0)
    })

    it('should handle invalid JSON', async () => {
      setToolContext({ documentContent: 'not json' })
      const result = await readOutlineTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })
  })

  describe('searchWebTool', () => {
    it('should handle empty query', async () => {
      const result = await searchWebTool.invoke(JSON.stringify({ query: '' }))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('should handle invalid JSON', async () => {
      const result = await searchWebTool.invoke('not json')
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })
  })

  describe('getWordCountTool', () => {
    it('should count characters and words', async () => {
      const result = await getWordCountTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.chars).toBeGreaterThan(0)
      expect(parsed.words).toBeGreaterThan(0)
      expect(parsed.message).toContain('字符')
    })

    it('should handle empty document', async () => {
      setToolContext({ documentContent: '' })
      const result = await getWordCountTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.chars).toBe(0)
    })
  })

  describe('createDocumentTool', () => {
    it('should return create action with title', async () => {
      const result = await createDocumentTool.invoke(JSON.stringify({ title: '新文档', content: '初始内容' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('create')
      expect(parsed.title).toBe('新文档')
      expect(parsed.content).toBeDefined()
      expect(parsed.content.type).toBe('doc')
    })

    it('should handle missing title', async () => {
      const result = await createDocumentTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('should create empty doc when no content', async () => {
      const result = await createDocumentTool.invoke(JSON.stringify({ title: '空文档' }))
      const parsed = JSON.parse(result)
      expect(parsed.content.content).toHaveLength(1)
      expect(parsed.content.content[0].type).toBe('paragraph')
    })
  })

  describe('suggestEditTool', () => {
    it('should return suggest action', async () => {
      const result = await suggestEditTool.invoke(JSON.stringify({
        description: '修改说明',
        before: '原文',
        after: '修改后',
      }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('suggest')
      expect(parsed.requireReview).toBe(true)
      expect(parsed.description).toBe('修改说明')
    })
  })

  describe('needsReview', () => {
    it('should require review for insert/replace/create/suggest', () => {
      expect(needsReview('insert_text')).toBe(true)
      expect(needsReview('replace_text')).toBe(true)
      expect(needsReview('create_document')).toBe(true)
      expect(needsReview('suggest_edit')).toBe(true)
    })

    it('should not require review for read/count/search', () => {
      expect(needsReview('read_document')).toBe(false)
      expect(needsReview('read_outline')).toBe(false)
      expect(needsReview('get_word_count')).toBe(false)
      expect(needsReview('search_web')).toBe(false)
    })
  })

  describe('getToolByName', () => {
    it('should find tool by name', () => {
      expect(getToolByName('insert_text')).toBe(insertTextTool)
      expect(getToolByName('search_web')).toBe(searchWebTool)
    })

    it('should return undefined for unknown tool', () => {
      expect(getToolByName('unknown')).toBeUndefined()
    })
  })

  describe('openAITools', () => {
    it('should have correct structure', () => {
      expect(openAITools.length).toBeGreaterThan(0)
      for (const tool of openAITools) {
        expect(tool.type).toBe('function')
        expect(tool.function.name).toBeDefined()
        expect(tool.function.parameters).toBeDefined()
      }
    })

    it('should include all original 8 tools', () => {
      const names = openAITools.map((t) => t.function.name)
      expect(names).toContain('insert_text')
      expect(names).toContain('replace_text')
      expect(names).toContain('read_document')
      expect(names).toContain('read_outline')
      expect(names).toContain('get_word_count')
      expect(names).toContain('search_web')
      expect(names).toContain('create_document')
      expect(names).toContain('suggest_edit')
    })

    it('should include Phase 7 tools', () => {
      const names = openAITools.map((t) => t.function.name)
      expect(names).toContain('search_all_documents')
      expect(names).toContain('get_document_tree')
      expect(names).toContain('export_document')
      expect(names).toContain('batch_export')
      expect(names).toContain('save_document')
      expect(names).toContain('trigger_shortcut')
      expect(names).toContain('spell_check')
    })

    it('should include Phase 8 tools', () => {
      const names = openAITools.map((t) => t.function.name)
      expect(names).toContain('update_document_metadata')
      expect(names).toContain('edit_outline')
      expect(names).toContain('editor_to_markdown')
      expect(names).toContain('markdown_to_editor')
      expect(names).toContain('create_backup')
      expect(names).toContain('restore_backup')
      expect(names).toContain('list_backups')
      expect(names).toContain('validate_document')
    })

    it('should include Phase 9 tools', () => {
      const names = openAITools.map((t) => t.function.name)
      expect(names).toContain('show_toast')
      expect(names).toContain('pre_export_process')
      expect(names).toContain('open_panel')
    })

    it('should have 95 total openAITools entries', () => {
      expect(openAITools.length).toBe(95)
    })
  })

  describe('allLangChainTools', () => {
    it('should have 96 total tools', () => {
      expect(allLangChainTools.length).toBe(96)
    })
  })

  describe('Phase 7 tools', () => {
    it('searchAllDocumentsTool should return results', async () => {
      const result = await searchAllDocumentsTool.invoke(JSON.stringify({ query: '正文' }))
      const parsed = JSON.parse(result)
      expect(parsed.query).toBe('正文')
      expect(parsed.documentsFound).toBeGreaterThanOrEqual(0)
    })

    it('getDocumentTreeTool should return tree structure', async () => {
      const result = await getDocumentTreeTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.tree).toBeDefined()
      expect(Array.isArray(parsed.tree)).toBe(true)
    })

    it('exportDocumentTool should handle missing doc gracefully', async () => {
      const result = await exportDocumentTool.invoke(JSON.stringify({ format: 'markdown' }))
      const parsed = JSON.parse(result)
      expect(parsed.action === 'exportDocument' || parsed.error !== undefined).toBe(true)
    })

    it('exportDocumentTool should handle missing doc', async () => {
      const result = await exportDocumentTool.invoke(JSON.stringify({ format: 'markdown', docId: 'nonexistent' }))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('batchExportTool should return batch info', async () => {
      const result = await batchExportTool.invoke(JSON.stringify({ format: 'markdown' }))
      const parsed = JSON.parse(result)
      expect(parsed.action === 'batchExport' || parsed.error !== undefined).toBe(true)
      if (parsed.action === 'batchExport') {
        expect(parsed.format).toBe('markdown')
      }
    })

    it('saveDocumentTool should save', async () => {
      const result = await saveDocumentTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('saveDocument')
      expect(parsed.message).toContain('已保存')
    })

    it('triggerShortcutTool should handle invalid shortcut', async () => {
      const result = await triggerShortcutTool.invoke(JSON.stringify({ shortcutId: 'nonexistent' }))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
      expect(parsed.available).toBeDefined()
    })

    it('spellCheckTool should check document', async () => {
      const result = await spellCheckTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action === 'spellCheck' || parsed.error !== undefined).toBe(true)
      if (parsed.action === 'spellCheck') {
        expect(parsed.totalIssues).toBeGreaterThanOrEqual(0)
        expect(parsed.wordCount).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Phase 8 tools', () => {
    it('updateDocumentMetadataTool should require docId', async () => {
      const result = await updateDocumentMetadataTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toContain('文档ID')
    })

    it('editOutlineTool should return action', async () => {
      const result = await editOutlineTool.invoke(JSON.stringify({ action: 'add', level: 1, text: '新标题' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('editOutline')
      expect(parsed.outlineAction).toBe('add')
    })

    it('editorToMarkdownTool should handle no doc gracefully', async () => {
      const result = await editorToMarkdownTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action === 'editorToMarkdown' || parsed.error !== undefined).toBe(true)
    })

    it('markdownToEditorTool should return markdown', async () => {
      const result = await markdownToEditorTool.invoke(JSON.stringify({ markdown: '# 标题' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('markdownToEditor')
      expect(parsed.markdown).toBe('# 标题')
    })

    it('markdownToEditorTool should require markdown', async () => {
      const result = await markdownToEditorTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('createBackupTool should create backup', async () => {
      const result = await createBackupTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action === 'createBackup' || parsed.error !== undefined).toBe(true)
      if (parsed.action === 'createBackup') {
        expect(parsed.backupId).toBeDefined()
        expect(typeof parsed.documentCount).toBe('number')
      }
    })

    it('listBackupsTool should list backups', async () => {
      const result = await listBackupsTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.totalBackups).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(parsed.backups)).toBe(true)
    })

    it('validateDocumentTool should validate', async () => {
      const result = await validateDocumentTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action === 'validateDocument' || parsed.error !== undefined).toBe(true)
      if (parsed.action === 'validateDocument') {
        expect(typeof parsed.valid).toBe('boolean')
        expect(Array.isArray(parsed.errors)).toBe(true)
        expect(Array.isArray(parsed.warnings)).toBe(true)
      }
    })
  })

  describe('Phase 9 tools', () => {
    it('showToastTool should show toast', async () => {
      const result = await showToastTool.invoke(JSON.stringify({ message: '测试消息', type: 'info' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('showToast')
      expect(parsed.message).toBe('测试消息')
    })

    it('preExportProcessTool should handle missing doc gracefully', async () => {
      const result = await preExportProcessTool.invoke(JSON.stringify({ action: 'clean' }))
      const parsed = JSON.parse(result)
      expect(parsed.action === 'preExportProcess' || parsed.error !== undefined).toBe(true)
    })

    it('openPanelTool should open panel', async () => {
      const result = await openPanelTool.invoke(JSON.stringify({ panel: 'settings' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('openPanel')
      expect(parsed.panel).toBe('settings')
    })

    it('openPanelTool should reject invalid panel', async () => {
      const result = await openPanelTool.invoke(JSON.stringify({ panel: 'invalid' }))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
      expect(parsed.available).toBeDefined()
    })
  })

  describe('needsReview (extended)', () => {
    it('should require review for destructive new tools', () => {
      expect(needsReview('restore_backup')).toBe(true)
      expect(needsReview('batch_export')).toBe(true)
      expect(needsReview('markdown_to_editor')).toBe(true)
    })

    it('should not require review for read-only new tools', () => {
      expect(needsReview('search_all_documents')).toBe(false)
      expect(needsReview('get_document_tree')).toBe(false)
      expect(needsReview('spell_check')).toBe(false)
      expect(needsReview('validate_document')).toBe(false)
    })
  })

  describe('getToolByName (extended)', () => {
    it('should find new tools by name', () => {
      expect(getToolByName('search_all_documents')).toBe(searchAllDocumentsTool)
      expect(getToolByName('export_document')).toBe(exportDocumentTool)
      expect(getToolByName('save_document')).toBe(saveDocumentTool)
      expect(getToolByName('validate_document')).toBe(validateDocumentTool)
      expect(getToolByName('open_panel')).toBe(openPanelTool)
      expect(getToolByName('get_ai_config')).toBe(getAIConfigTool)
      expect(getToolByName('import_file')).toBe(importFileTool)
      expect(getToolByName('toggle_typewriter_mode')).toBe(toggleTypewriterModeTool)
      expect(getToolByName('check_crash_recovery')).toBe(checkCrashRecoveryTool)
    })
  })

  describe('Phase 10 tools', () => {
    it('getAIConfigTool should return config status', async () => {
      const result = await getAIConfigTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('getAIConfig')
      expect(typeof parsed.configured).toBe('boolean')
    })

    it('setAIConfigTool should set config', async () => {
      const result = await setAIConfigTool.invoke(JSON.stringify({ provider: 'openai', model: 'gpt-4' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('setAIConfig')
      expect(parsed.message).toContain('已更新')
    })

    it('clearAIConfigTool should clear config', async () => {
      const result = await clearAIConfigTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('clearAIConfig')
    })

    it('getCloudConfigTool should return config status', async () => {
      const result = await getCloudConfigTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('getCloudConfig')
      expect(typeof parsed.configured).toBe('boolean')
    })

    it('setCloudConfigTool should require provider', async () => {
      const result = await setCloudConfigTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('getQueueStatusTool should return status', async () => {
      const result = await getQueueStatusTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('getQueueStatus')
    })
  })

  describe('Phase 11 tools', () => {
    it('checkCrashRecoveryTool should check data', async () => {
      const result = await checkCrashRecoveryTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('checkCrashRecovery')
      expect(typeof parsed.hasData).toBe('boolean')
    })

    it('clearCrashDataTool should clear data', async () => {
      const result = await clearCrashDataTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('clearCrashData')
    })

    it('listPluginsTool should list plugins', async () => {
      const result = await listPluginsTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('listPlugins')
      expect(Array.isArray(parsed.plugins)).toBe(true)
    })

    it('togglePluginTool should require pluginId', async () => {
      const result = await togglePluginTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })
  })

  describe('Phase 12 tools', () => {
    it('importFileTool should import content', async () => {
      const result = await importFileTool.invoke(JSON.stringify({ title: '导入测试', content: '测试内容', format: 'txt' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('importFile')
      expect(parsed.docId).toBeDefined()
      expect(parsed.title).toBe('导入测试')
    })

    it('importFileTool should require title', async () => {
      const result = await importFileTool.invoke(JSON.stringify({ content: '内容' }))
      const parsed = JSON.parse(result)
      expect(parsed.error).toContain('title')
    })

    it('importFileTool should require content', async () => {
      const result = await importFileTool.invoke(JSON.stringify({ title: '标题' }))
      const parsed = JSON.parse(result)
      expect(parsed.error).toContain('content')
    })
  })

  describe('Phase 13 tools', () => {
    it('toggleTypewriterModeTool should toggle', async () => {
      const result = await toggleTypewriterModeTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('toggleTypewriterMode')
      expect(typeof parsed.enabled).toBe('boolean')
    })

    it('toggleFullscreenTool should toggle', async () => {
      const result = await toggleFullscreenTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('toggleFullscreen')
      expect(typeof parsed.enabled).toBe('boolean')
    })

    it('repairDocumentTool should handle no doc', async () => {
      const result = await repairDocumentTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action === 'repairDocument' || parsed.error !== undefined).toBe(true)
    })
  })

  describe('Phase 14 tools', () => {
    it('collaborationConnectTool should connect', async () => {
      const result = await collaborationConnectTool.invoke(JSON.stringify({ server: 'ws://localhost:3000' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('collaborationConnect')
      expect(parsed.server).toBe('ws://localhost:3000')
    })

    it('collaborationDisconnectTool should disconnect', async () => {
      const result = await collaborationDisconnectTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('collaborationDisconnect')
    })
  })

  describe('Phase 15 tools', () => {
    it('listShortcutsTool should list shortcuts', async () => {
      const result = await listShortcutsTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('listShortcuts')
      expect(parsed.total).toBeGreaterThan(0)
      expect(Array.isArray(parsed.shortcuts)).toBe(true)
    })

    it('updateShortcutTool should require shortcutId', async () => {
      const result = await updateShortcutTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('resetShortcutTool should require shortcutId', async () => {
      const result = await resetShortcutTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('findShortcutConflictsTool should detect conflicts', async () => {
      const result = await findShortcutConflictsTool.invoke(JSON.stringify({ shortcutId: 'bold', key: 'b', ctrl: true }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('findShortcutConflicts')
      expect(typeof parsed.hasConflicts).toBe('boolean')
    })
  })

  describe('Phase 16 tools', () => {
    it('getCursorPositionTool should return position', async () => {
      const result = await getCursorPositionTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action === 'getCursorPosition' || parsed.error !== undefined).toBe(true)
    })

    it('getScrollPositionTool should return position', async () => {
      const result = await getScrollPositionTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action === 'getScrollPosition' || parsed.error !== undefined).toBe(true)
    })

    it('clearUndoHistoryTool should handle no doc', async () => {
      const result = await clearUndoHistoryTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action === 'clearUndoHistory' || parsed.error !== undefined).toBe(true)
    })

    it('getTotalWordCountTool should return counts', async () => {
      const result = await getTotalWordCountTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('getTotalWordCount')
      expect(typeof parsed.currentCount).toBe('number')
      expect(typeof parsed.totalCount).toBe('number')
    })
  })

  describe('Phase 17 tools', () => {
    it('resolveCommentTool should require commentId', async () => {
      const result = await resolveCommentTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('deleteCommentTool should require commentId', async () => {
      const result = await deleteCommentTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('addReplyTool should require commentId and content', async () => {
      const result = await addReplyTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })
  })

  describe('Phase 18 tools', () => {
    it('setFocusToolbarModeTool should set mode', async () => {
      const result = await setFocusToolbarModeTool.invoke(JSON.stringify({ mode: 'auto' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('setFocusToolbarMode')
      expect(parsed.mode).toBe('auto')
    })

    it('setFocusToolbarModeTool should reject invalid mode', async () => {
      const result = await setFocusToolbarModeTool.invoke(JSON.stringify({ mode: 'invalid' }))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('getUIStateTool should return state', async () => {
      const result = await getUIStateTool.invoke('')
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('getUIState')
      expect(typeof parsed.focusMode).toBe('boolean')
      expect(typeof parsed.sidebarOpen).toBe('boolean')
    })

    it('renameFolderTool should require folderId', async () => {
      const result = await renameFolderTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })

    it('removeFolderTool should require folderId', async () => {
      const result = await removeFolderTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })
  })

  describe('Phase 19 tools', () => {
    it('createDialogTool should require title', async () => {
      const result = await createDialogTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toContain('title')
    })

    it('createDialogTool should create info dialog', async () => {
      const result = await createDialogTool.invoke(JSON.stringify({ title: '测试', content: '内容', type: 'info' }))
      const parsed = JSON.parse(result)
      expect(parsed.action).toBe('createDialog')
      expect(parsed.type).toBe('info')
    })

    it('simulateClickTool should require selector', async () => {
      const result = await simulateClickTool.invoke(JSON.stringify({}))
      const parsed = JSON.parse(result)
      expect(parsed.error).toContain('selector')
    })

    it('simulateClickTool should handle missing element', async () => {
      const result = await simulateClickTool.invoke(JSON.stringify({ selector: '#nonexistent' }))
      const parsed = JSON.parse(result)
      expect(parsed.error).toBeDefined()
    })
  })
})