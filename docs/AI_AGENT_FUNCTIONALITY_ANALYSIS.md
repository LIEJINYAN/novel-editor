# AI Agent 功能限制分析报告

## 当前 AI Agent 工具（8个）

| 工具 | 功能 | 状态 |
|------|------|------|
| `insert_text` | 插入文本到光标位置 | ✅ 已实现 |
| `replace_text` | 替换选中文本 | ✅ 已实现 |
| `read_document` | 读取当前文档内容 | ✅ 已实现 |
| `read_outline` | 读取文档大纲 | ✅ 已实现 |
| `search_web` | 搜索网页 | ✅ 已实现 |
| `get_word_count` | 获取字数统计 | ✅ 已实现 |
| `create_document` | 创建新文档 | ✅ 已实现 |
| `suggest_edit` | 建议编辑（需用户确认） | ✅ 已实现 |

---

## 🔴 P0 级别 - 无法完成的关键任务

### 1. **无法操作编辑器格式**
**原因**：AI Agent 无法调用 Tiptap 编辑器的格式化命令

**当前能力**：
- 只能插入/替换纯文本
- 无法应用格式（加粗、斜体、标题等）

**需要的操作**：
```typescript
// 编辑器支持的格式化命令
editor.chain().focus().toggleBold().run()      // 加粗
editor.chain().focus().toggleItalic().run()    // 斜体
editor.chain().focus().toggleUnderline().run() // 下划线
editor.chain().focus().toggleStrike().run()    // 删除线
editor.chain().focus().toggleHeading({ level: 1 }).run() // 标题1
editor.chain().focus().toggleBulletList().run() // 无序列表
editor.chain().focus().toggleOrderedList().run() // 有序列表
editor.chain().focus().toggleBlockquote().run() // 引用
editor.chain().focus().toggleCodeBlock().run() // 代码块
editor.chain().focus().setHighlight().run()    // 高亮
```

**解决方案**：
添加 `format_text` 工具，支持以下操作：
- `bold` / `italic` / `underline` / `strike`
- `heading` (level: 1/2/3)
- `bulletList` / `orderedList` / `blockquote`
- `codeBlock` / `highlight`
- `clearFormatting`

---

### 2. **无法进行搜索替换**
**原因**：AI Agent 没有访问编辑器的搜索替换功能

**当前能力**：
- 只能读取整个文档内容
- 无法定位特定文本

**需要的操作**：
- 在文档中搜索文本
- 获取搜索结果位置
- 批量替换文本

**解决方案**：
添加 `find_in_document` 和 `replace_in_document` 工具：
```typescript
// find_in_document
{
  query: string,           // 搜索关键词
  useRegex?: boolean,      // 是否使用正则
  caseSensitive?: boolean  // 是否区分大小写
}

// replace_in_document
{
  find: string,            // 查找文本
  replace: string,         // 替换文本
  replaceAll?: boolean     // 是否全部替换
}
```

---

### 3. **无法操作文档结构**
**原因**：AI Agent 没有访问 documentStore 和 tabStore 的权限

**当前能力**：
- 只能创建新文档
- 无法删除/重命名/移动文档

**需要的操作**：
- 删除文档
- 重命名文档
- 移动文档到文件夹
- 创建/删除文件夹

**解决方案**：
添加文档管理工具：
```typescript
// delete_document
{ docId: string }

// rename_document
{ docId: string, newTitle: string }

// move_document
{ docId: string, folderId: string | null }

// create_folder
{ name: string, parentId?: string }

// delete_folder
{ folderId: string }
```

---

## 🟡 P1 级别 - 重要的功能限制

### 4. **无法操作标签页**
**原因**：AI Agent 没有访问 tabStore 的权限

**当前能力**：
- 只能通过 `create_document` 打开新标签页
- 无法操作已有标签页

**需要的操作**：
- 打开已有文档的标签页
- 关闭标签页
- 切换活动标签页
- 获取当前打开的标签页列表

**解决方案**：
添加标签页管理工具：
```typescript
// open_tab
{ docId: string }

// close_tab
{ docId: string }

// switch_tab
{ docId: string }

// list_tabs
// 无需参数，返回当前打开的标签页列表
```

---

### 5. **无法操作撤销/重做**
**原因**：AI Agent 没有访问 documentSessionStore 的权限

**当前能力**：
- 编辑器有 undo/redo 功能
- AI Agent 无法直接调用

**需要的操作**：
- 执行撤销操作
- 执行重做操作
- 检查是否可以撤销/重做

**解决方案**：
添加撤销/重做工具：
```typescript
// undo
// 无需参数

// redo
// 无需参数

// can_undo / can_redo
// 返回布尔值
```

---

### 6. **无法访问其他标签页的文档**
**原因**：`read_document` 只能读取当前活动文档

**当前能力**：
- 只能读取当前文档内容
- 无法读取其他已打开文档

**需要的操作**：
- 读取指定文档的内容
- 读取多个文档的内容

**解决方案**：
修改 `read_document` 工具，添加 `docId` 参数：
```typescript
// read_document (改进版)
{ docId?: string }  // 如果不提供，读取当前文档
```

---

### 7. **无法操作代码块**
**原因**：AI Agent 无法创建或操作 Monaco 代码块

**当前能力**：
- 编辑器有 Monaco 代码块扩展
- AI Agent 无法创建或操作

**需要的操作**：
- 创建代码块
- 设置代码块语言
- 插入代码到代码块

**解决方案**：
添加代码块工具：
```typescript
// create_code_block
{
  language: string,  // 编程语言
  code?: string      // 初始代码
}

// update_code_block
{
  code: string       // 新代码内容
}
```

---

## 🟢 P2 级别 - 增强功能

### 8. **无法添加/管理评论**
**原因**：AI Agent 没有访问 commentStore 的权限

**当前能力**：
- 编辑器有 CommentPanel 组件
- AI Agent 无法添加评论

**解决方案**：
添加评论工具：
```typescript
// add_comment
{
  content: string,      // 评论内容
  selection?: string    // 关联的选中文本
}

// list_comments
// 返回所有评论
```

---

### 9. **无法操作版本历史**
**原因**：AI Agent 没有访问版本历史功能

**当前能力**：
- 编辑器有 VersionHistory 功能
- AI Agent 无法创建或恢复版本

**解决方案**：
添加版本管理工具：
```typescript
// create_version
// 创建当前文档的版本快照

// restore_version
{ versionId: string }

// list_versions
// 返回所有版本列表
```

---

### 10. **无法获取写作统计**
**原因**：AI Agent 没有访问 writingStatsStore 的权限

**当前能力**：
- 编辑器有 WritingStatsPanel
- AI Agent 无法获取统计数据

**解决方案**：
添加统计工具：
```typescript
// get_writing_stats
// 返回写作统计数据（字数趋势、时间统计等）
```

---

### 11. **无法进行批量操作**
**原因**：当前工具都是单次操作

**当前能力**：
- 每次只能执行一个工具
- 无法组合多个操作

**解决方案**：
添加批量操作工具：
```typescript
// batch_operation
{
  operations: Array<{
    tool: string,
    args: object
  }>
}
```

---

## 📊 功能对比表

| 功能类别 | 当前状态 | 缺失的工具 |
|----------|----------|------------|
| **文本操作** | ✅ 插入/替换 | ❌ 格式化、搜索替换 |
| **文档管理** | ✅ 创建 | ❌ 删除、重命名、移动 |
| **标签页** | ❌ 无 | ❌ 打开、关闭、切换 |
| **格式化** | ❌ 无 | ❌ 加粗、斜体、标题等 |
| **搜索** | ❌ 无 | ❌ 文档内搜索、替换 |
| **撤销/重做** | ❌ 无 | ❌ undo、redo |
| **评论** | ❌ 无 | ❌ 添加、管理评论 |
| **版本** | ❌ 无 | ❌ 创建、恢复版本 |
| **统计** | ❌ 无 | ❌ 写作统计 |
| **代码块** | ❌ 无 | ❌ 创建、操作代码块 |

---

## 🎯 推荐实现顺序

### Phase 1: P0 优先级（必做）
1. **format_text** - 格式化文本工具
2. **find_in_document** - 文档内搜索
3. **replace_in_document** - 文档内替换
4. **delete_document** - 删除文档
5. **rename_document** - 重命名文档

### Phase 2: P1 优先级（重要）
6. **open_tab** - 打开标签页
7. **close_tab** - 关闭标签页
8. **list_tabs** - 列出标签页
9. **read_document** 支持 docId 参数
10. **undo/redo** - 撤销重做工具

### Phase 3: P2 优先级（增强）
11. **create_code_block** - 创建代码块
12. **add_comment** - 添加评论
13. **create_version** - 创建版本
14. **get_writing_stats** - 获取统计

---

## 🔧 技术实现要点

### 1. 格式化工具需要访问编辑器实例
```typescript
// 需要通过 context 传递编辑器实例
interface ToolContext {
  documentContent: string
  documentTitle: string
  selection: string
  cursorPosition: number
  editor?: Editor  // 新增
}
```

### 2. 文档管理工具需要访问 store
```typescript
// 需要导入 store
import { useDocumentStore } from '../store/documentStore'
import { useTabStore } from '../store/tabStore'
```

### 3. 搜索替换需要访问编辑器
```typescript
// 需要通过编辑器 API 执行搜索
editor.commands.focus()
editor.commands.find(query)
```

### 4. 批量操作需要事务处理
```typescript
// 需要确保原子性
editor.chain().focus()
  .toggleBold()
  .insertContent('text')
  .run()
```

---

## 📝 总结

当前 AI Agent 的核心限制：
1. **无法格式化文本** - 只能插入纯文本
2. **无法搜索替换** - 只能读取整个文档
3. **无法管理文档结构** - 只能创建新文档
4. **无法操作标签页** - 只能通过创建文档打开新标签
5. **无法撤销/重做** - 编辑器有功能但 Agent 无法调用

实现这些工具后，AI Agent 将能够：
- 完整控制编辑器格式
- 在文档中搜索和替换
- 管理整个文档结构
- 操作标签页和文档
- 执行复杂的编辑操作
