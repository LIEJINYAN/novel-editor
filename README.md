# NovelEngine Editor

一款现代化的小说编辑器，结合富文本编辑（Tiptap）与 AI 辅助写作，支持桌面端和 Web 端。

## 功能特性

### 核心编辑
- **富文本编辑器** — 基于 Tiptap (ProseMirror)，支持加粗、斜体、下划线、标题、列表、引用、代码块等
- **代码编辑器** — Monaco Editor，支持语法高亮
- **多标签页** — 最多 10 个标签页，LRU 缓存策略，支持 7 种文档图标
- **独立撤销/重做** — 每个文档独立的撤销栈（最多 100 步）

### AI 辅助写作
- **24 种 AI 命令** — 改写、续写、总结、翻译、扩写、缩写、润色、检查、情感分析、风格转换等
- **6 个写作模板** — 小说开头、角色设计、世界观构建、情节大纲、对话场景、动作场景
- **流式响应** — 支持 SSE 流式输出

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

- React 18 + TypeScript
- Vite 6
- Tiptap 2 (ProseMirror)
- Monaco Editor 0.55
- Zustand 5
- Tailwind CSS 3
- Tauri 2 (桌面端)

## 开发

### 环境要求

- Node.js 20+
- pnpm 9+
- Rust (用于 Tauri)

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

### 构建

```bash
# Web 版本
pnpm build

# 桌面端
pnpm tauri:build
```

## 部署

### GitHub Pages

代码推送到 main 分支后，GitHub Actions 自动构建部署。

### Vercel

连接 GitHub 仓库，自动检测 Vite 项目并部署。

### Netlify

连接 GitHub 仓库，构建命令 `pnpm build`，发布目录 `dist`。

## 项目结构

```
novel-editor/
├── src/
│   ├── components/      # UI 组件
│   ├── store/           # 状态管理
│   ├── services/        # 服务层
│   ├── hooks/           # React Hooks
│   ├── utils/           # 工具函数
│   ├── i18n/            # 国际化
│   └── __tests__/       # 测试
├── server/              # WebSocket 协作服务器
├── src-tauri/           # Tauri 桌面端配置
├── docs/                # 文档
└── .github/workflows/   # CI/CD
```

## 许可证

MIT License
