# NovelEngine Editor 开发者文档

## 目录

1. [项目结构](#项目结构)
2. [开发环境](#开发环境)
3. [技术架构](#技术架构)
4. [核心模块](#核心模块)
5. [状态管理](#状态管理)
6. [AI 集成](#ai-集成)
7. [数据持久化](#数据持久化)
8. [部署指南](#部署指南)
9. [贡献指南](#贡献指南)

---

## 项目结构

```
novel-editor/
├── public/                    # 静态资源
├── src/
│   ├── components/           # UI 组件
│   │   ├── Editor/          # 编辑器组件
│   │   ├── AIPanel/         # AI 面板
│   │   ├── Sidebar/         # 侧边栏
│   │   ├── TabBar/          # 标签栏
│   │   ├── Search/          # 搜索
│   │   ├── FindReplace/     # 查找替换
│   │   ├── FocusMode/       # 专注模式
│   │   ├── WritingModes/    # 写作模式
│   │   ├── WritingStats/    # 写作统计
│   │   ├── WordCount/       # 字数统计
│   │   ├── WordGoal/        # 字数目标
│   │   ├── DocumentOutline/ # 文档大纲
│   │   ├── Settings/        # 设置面板
│   │   ├── PluginMarket/    # 插件市场
│   │   ├── ErrorBoundary/   # 错误边界
│   │   └── LanguageSwitcher/ # 语言切换
│   ├── store/                # Zustand 状态管理
│   │   ├── documentStore.ts # 文档状态
│   │   ├── themeStore.ts    # 主题状态
│   │   ├── uiStore.ts       # UI 状态
│   │   ├── tabStore.ts      # 标签页状态
│   │   ├── writingStatsStore.ts # 写作统计
│   │   ├── wordGoalStore.ts # 字数目标
│   │   ├── autoSaveStore.ts # 自动保存
│   │   ├── customThemeStore.ts # 自定义主题
│   │   ├── documentSessionStore.ts # 文档会话
│   │   ├── documentCacheStore.ts # 文档缓存
│   │   └── collaborationStore.ts # 协作状态
│   ├── services/             # 服务层
│   │   ├── aiService.ts     # AI 服务
│   │   ├── cloudSync.ts     # 云同步
│   │   ├── pluginSystem.ts  # 插件系统
│   │   └── collaboration.ts # 协作服务
│   ├── hooks/                # React Hooks
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useAutoSave.ts
│   │   └── useMobile.ts
│   ├── utils/                # 工具函数
│   │   ├── export.ts        # 导出功能
│   │   └── idb.ts           # IndexedDB
│   ├── editor/               # 编辑器配置
│   │   └── novelEditor.ts   # Tiptap 配置
│   ├── i18n/                 # 国际化
│   │   ├── index.ts
│   │   ├── zh-CN.ts
│   │   └── en-US.ts
│   ├── styles/               # 样式
│   │   └── index.css        # 全局样式
│   ├── __tests__/            # 测试
│   │   ├── aiService.test.ts
│   │   ├── documentStore.test.ts
│   │   ├── themeStore.test.ts
│   │   ├── wordGoalStore.test.ts
│   │   ├── export.test.ts
│   │   ├── Extensions.test.ts
│   │   └── integration.test.ts
│   ├── App.tsx               # 根组件
│   └── main.tsx              # 入口文件
├── server/                   # WebSocket 服务器
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── src-tauri/                # Tauri 配置
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── capabilities/
│   │   └── default.json
│   ├── icons/
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Pages 部署
├── docs/
│   └── USER_MANUAL.md        # 用户手册
├── index.html
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vercel.json               # Vercel 配置
├── netlify.toml              # Netlify 配置
└── .gitignore
```

---

## 开发环境

### 前置要求

- Node.js 20+
- pnpm 9+
- Rust (用于 Tauri)
- Git

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 运行测试

```bash
pnpm test
```

### 构建生产版本

```bash
pnpm build
```

---

## 技术架构

### 前端架构

```
┌─────────────────────────────────────────────────────┐
│                    React App                        │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Tiptap  │  │ Monaco  │  │   AI    │            │
│  │ Editor  │  │ Editor  │  │  Panel  │            │
│  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │                  │
├───────┴────────────┴────────────┴──────────────────┤
│                 State Management                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Document│  │  Theme  │  │   UI    │            │
│  │  Store  │  │  Store  │  │  Store  │            │
│  └─────────┘  └─────────┘  └─────────┘            │
├─────────────────────────────────────────────────────┤
│                 Service Layer                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │   AI    │  │  Cloud  │  │Plugin   │            │
│  │ Service │  │  Sync   │  │ System  │            │
│  └─────────┘  └─────────┘  └─────────┘            │
├─────────────────────────────────────────────────────┤
│                 Data Layer                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │IndexedDB│  │ Local   │  │Session  │            │
│  │         │  │Storage  │  │Storage  │            │
│  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────┘
```

### 状态管理

使用 Zustand 进行状态管理，每个 store 负责特定功能：

- `documentStore`: 文档 CRUD、当前文档、加载状态
- `themeStore`: 主题切换、自动换行
- `uiStore`: 专注模式、打字机模式、全屏
- `tabStore`: 多标签页管理
- `writingStatsStore`: 写作统计
- `wordGoalStore`: 字数目标
- `autoSaveStore`: 自动保存策略
- `customThemeStore`: 自定义主题颜色
- `documentSessionStore`: 每个文档的撤销/重做栈
- `documentCacheStore`: LRU 文档缓存
- `collaborationStore`: 实时协作状态

---

## 核心模块

### 编辑器 (Tiptap)

文件：`src/editor/novelEditor.ts`

```typescript
// 扩展列表
const extensions = [
  StarterKit,
  Highlight,
  Underline,
  Placeholder,
  Typography,
  CodeBlockLowlight,
  CharacterCount,
]
```

### AI 服务

文件：`src/services/aiService.ts`

- 24 种 AI 命令
- 6 个写作模板
- 流式响应 (SSE)
- 队列管理
- 超时和重试

### 导出服务

文件：`src/utils/export.ts`

- Markdown
- HTML
- PDF
- TXT
- Word (HTML)
- EPUB

---

## 状态管理

### 文档 Store

```typescript
interface DocumentState {
  documents: Document[]
  currentDocId: string | null
  isLoaded: boolean
  isDirty: boolean

  // Actions
  addDoc: (title: string, content?: string) => string
  updateDoc: (id: string, updates: Partial<Document>) => void
  deleteDoc: (id: string) => void
  setCurrentDoc: (id: string) => void
  loadFromDB: () => Promise<void>
  saveToDB: () => Promise<void>
}
```

### 主题 Store

```typescript
interface ThemeState {
  isDark: boolean
  wordWrap: boolean

  // Actions
  toggleTheme: () => void
  toggleWordWrap: () => void
}
```

### UI Store

```typescript
interface UIState {
  focusMode: boolean
  typewriterMode: boolean
  fullscreen: boolean
  sidebarOpen: boolean
  aiPanelOpen: boolean
  focusToolbarMode: 'auto' | 'always' | 'never'

  // Actions
  toggleFocusMode: () => void
  toggleTypewriterMode: () => void
  toggleFullscreen: () => void
  toggleSidebar: () => void
  toggleAIPanel: () => void
  cycleFocusToolbarMode: () => void
}
```

---

## AI 集成

### 配置

```typescript
const aiService = AIService.getInstance()
aiService.setConfig({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  maxTokens: 2000,
  temperature: 0.7,
})
```

### 使用

```typescript
// 流式响应
const stream = await aiService.stream('rewrite', '要改写的文本')
for await (const chunk of stream) {
  console.log(chunk.content)
}

// 一次性响应
const result = await aiService.complete('summary', '要总结的文本')
```

---

## 数据持久化

### IndexedDB

用于存储文档内容：

```typescript
// 保存文档
await saveToIndexedDB('documents', doc)

// 读取文档
const doc = await getFromIndexedDB('documents', id)

// 删除文档
await deleteFromIndexedDB('documents', id)
```

### localStorage

用于存储配置：

- 主题设置
- 自动保存策略
- 字数目标
- 写作统计
- 自定义主题
- 云同步配置

---

## 部署指南

### Web 部署

#### GitHub Pages

1. 推送到 main 分支
2. GitHub Actions 自动构建部署
3. 访问 `https://username.github.io/novel-editor/`

#### Vercel

1. 连接 GitHub 仓库
2. 自动检测 Vite 项目
3. 部署完成

#### Netlify

1. 连接 GitHub 仓库
2. 构建命令：`pnpm build`
3. 发布目录：`dist`

### 桌面端部署

#### Tauri

```bash
# 开发模式
pnpm tauri:dev

# 构建安装包
pnpm tauri:build
```

安装包位于 `src-tauri/target/release/bundle/`

---

## 贡献指南

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Tailwind CSS
- 组件使用 PascalCase
- 文件名使用 PascalCase

### 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

### 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch
```

---

## 性能优化

- 代码分割（React.lazy）
- 虚拟滚动
- LRU 缓存
- 防抖处理
- 事件委托

---

## 安全考虑

- XSS 防护
- CSRF 防护
- 内容安全策略
- 输入验证
- 敏感信息加密

---

## 未来计划

- [ ] 实时协作 (WebSocket/WebRTC)
- [ ] 版本历史
- [ ] 更多 AI 命令
- [ ] 插件市场
- [ ] 团队协作
- [ ] 离线支持
- [ ] PWA 支持
