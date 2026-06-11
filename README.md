# NovelEngine Editor

一款现代化的小说编辑器，结合富文本编辑（Tiptap）与 AI 辅助写作，支持桌面端和 Web 端。

## 功能特性

### 核心编辑
- **富文本编辑器** — 基于 Tiptap (ProseMirror)，支持加粗、斜体、下划线、标题、列表、引用、代码块等
- **代码编辑器** — Monaco Editor，支持语法高亮
- **多标签页** — 最多 10 个标签页，LRU 缓存策略，支持 7 种文档图标
- **独立撤销/重做** — 每个文档独立的撤销栈（最多 100 步）
- **多窗口支持** — 创建新窗口独立编辑文档，窗口间事件通信

### AI 辅助写作
- **24 种 AI 命令** — 改写、续写、总结、翻译、扩写、缩写、润色、检查、情感分析、风格转换等
- **6 个写作模板** — 小说开头、角色设计、世界观构建、情节大纲、对话场景、动作场景
- **流式响应** — 支持 SSE 流式输出
- **AI Agent 工具** — 96 个工具覆盖 19 个写作阶段

### 写作模式
- **5 种预设模式** — 小说、散文、诗歌、笔记、沉浸模式
- 每种模式自动配置换行、字数目标、保存策略

### 专注写作
- **专注模式** — 隐藏所有 UI，仅显示编辑区域
- **打字机模式** — 光标始终居中
- **全屏模式** — F11 切换
- **边缘触发工具栏** — 专注模式下鼠标移到顶部显示工具栏

### 数据管理
- **自动保存** — 支持自动、智能、手动三种策略
- **全文搜索** — 支持大小写敏感
- **查找替换** — Ctrl+H 快速替换
- **文档大纲** — 自动从标题生成
- **Deep Link** — 通过 `novelengine://open/<path>` 协议直接打开文件

### 统计与目标
- **写作统计** — 每日/每周/每月字数统计
- **字数目标** — 每日、章节、小说总目标
- **实时字数** — 状态栏显示

### 导出功能
支持 6 种格式导出：
- Markdown (.md)
- HTML (.html)
- PDF (.pdf)
- TXT (.txt)
- Word (.html)
- EPUB (.epub)

### 个性化
- **主题切换** — 亮色/暗色主题
- **自定义主题** — 6 个预设 + 8 个颜色选择器
- **快捷键自定义** — 27 个快捷键可自定义
- **中英文切换** — 完整 i18n 支持

### 云同步
支持 3 种云同步方式：
- WebDAV
- GitHub
- Gitee

### 协作功能
- **实时协作** — WebSocket 服务端，支持多人同时编辑
- **光标同步** — 实时显示协作者光标位置
- **操作转换** — OT 算法处理并发冲突

### 插件系统
- **插件市场** — 浏览、安装、启用/禁用插件
- 支持编辑器扩展、AI 增强、导出增强、主题等分类

### 多窗口
- 创建独立窗口编辑不同文档
- 窗口间事件通信（`create-new-window`）
- 通过 Tauri WebviewWindow API 管理窗口生命周期

### Deep Link
- 支持 `novelengine://open/<file-path>` 协议
- 自动读取文件内容并创建新文档
- 支持 Markdown 和纯文本格式自动检测

### 无障碍
- 完整 ARIA 标签支持
- 键盘导航
- 屏幕阅读器兼容

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+S | 保存 |
| Ctrl+Z / Ctrl+Y | 撤销 / 重做 |
| Ctrl+B / Ctrl+I / Ctrl+U | 加粗 / 斜体 / 下划线 |
| Ctrl+F | 搜索 |
| Ctrl+H | 查找替换 |
| Ctrl+Shift+F | 专注模式 |
| Ctrl+Shift+T | 打字机模式 |
| Ctrl+Shift+O | 文档大纲 |
| Ctrl+Shift+W | 字数统计 |
| Ctrl+Shift+P | 写作统计 |
| Ctrl+1-9 | 切换标签页 |
| F1 | 快捷键帮助 |
| F11 | 全屏 |
| ESC | 退出专注模式 |

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **富文本编辑器**: Tiptap 2 (ProseMirror)
- **代码编辑器**: Monaco Editor 0.55
- **状态管理**: Zustand 5
- **样式**: Tailwind CSS 3
- **桌面端**: Tauri 2
- **AI 框架**: LangChain (LangGraph)
- **包管理**: pnpm

## 安装

### 环境要求

- Node.js 20+
- pnpm 9+
- Rust (用于 Tauri 桌面端构建)

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
# Web 版本
pnpm dev

# 桌面端
pnpm tauri:dev
```

### 构建

```bash
# Web 版本
pnpm build

# 桌面端
pnpm tauri:build
```

## 开发

### 项目结构

```
novel-editor/
├── src/
│   ├── components/      # UI 组件
│   ├── store/           # 状态管理 (Zustand)
│   ├── services/        # 服务层 (Tauri, AI)
│   ├── hooks/           # React Hooks
│   ├── utils/           # 工具函数
│   ├── i18n/            # 国际化
│   ├── editor/          # 编辑器扩展
│   ├── extensions/      # Tiptap 扩展
│   ├── bridges/         # 桥接层
│   ├── plugins/         # 插件系统
│   ├── styles/          # 全局样式
│   └── __tests__/       # 测试
├── server/              # WebSocket 协作服务器
├── src-tauri/           # Tauri 桌面端配置
├── docs/                # 文档
├── e2e/                 # 端到端测试
└── .github/workflows/   # CI/CD
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 React Hooks 最佳实践
- 组件采用函数式写法
- 状态管理使用 Zustand slices

## 测试

### 单元测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch
```

### 端到端测试

```bash
# 运行 Playwright 测试
pnpm test:e2e

# 带 UI 的测试模式
pnpm test:e2e:ui
```

### 类型检查

```bash
pnpm lint
```

## AI Agent 工具

AI Agent 包含 96 个工具，覆盖 19 个写作阶段：

| 阶段 | 工具数 | 说明 |
|------|--------|------|
| 1. 构思 | 5 | 头脑风暴、主题探索 |
| 2. 大纲 | 5 | 故事结构、章节规划 |
| 3. 世界观 | 5 | 背景设定、规则体系 |
| 4. 角色 | 6 | 人物设计、关系图谱 |
| 5. 情节 | 6 | 冲突设计、转折点 |
| 6. 开头 | 5 | 开篇写作、悬念设置 |
| 7. 发展 | 6 | 情节推进、节奏控制 |
| 8. 高潮 | 5 | 冲突升级、情感爆发 |
| 9. 结局 | 5 | 收尾处理、主题升华 |
| 10. 对话 | 5 | 角色对白、语气把控 |
| 11. 描写 | 6 | 场景描写、感官细节 |
| 12. 叙事 | 5 | 视角切换、时间线 |
| 13. 润色 | 6 | 语言优化、修辞手法 |
| 14. 检查 | 5 | 一致性、逻辑校验 |
| 15. 翻译 | 5 | 多语言翻译 |
| 16. 风格 | 5 | 文风转换、仿写 |
| 17. 分析 | 5 | 文本分析、情感检测 |
| 18. 互动 | 5 | 读者反馈、改编建议 |
| 19. 出版 | 5 | 格式化、元数据 |

## Deep Link 协议

应用注册了 `novelengine://` 协议，支持以下操作：

```
novelengine://open/<file-path>
```

**示例:**
```
novelengine://open/C:/Users/username/Documents/novel.md
novelengine://open//home/user/novel.txt
```

收到 Deep Link 后，应用会：
1. 读取指定路径的文件内容
2. 自动检测文件格式（Markdown / 纯文本）
3. 创建新文档并切换到该文档
4. 在新标签页中打开

## 多窗口

多窗口功能通过 Tauri 的 WebviewWindow API 实现：

- `createWindow(url)` — 创建新窗口
- `onWindowCreated(callback)` — 监听窗口创建事件
- `createNewWindow(title)` — 创建新文档并打开
- 窗口间通过 Tauri 事件系统通信

## 部署

### GitHub Pages

代码推送到 main 分支后，GitHub Actions 自动构建部署。

### Vercel

连接 GitHub 仓库，自动检测 Vite 项目并部署。

### Netlify

连接 GitHub 仓库，构建命令 `pnpm build`，发布目录 `dist`。

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发流程

1. 确保 Node.js 20+ 和 pnpm 9+ 已安装
2. 运行 `pnpm install` 安装依赖
3. 运行 `pnpm dev` 启动开发服务器
4. 运行 `pnpm test` 确保测试通过
5. 运行 `pnpm lint` 确保类型检查通过

## 许可证

MIT License
