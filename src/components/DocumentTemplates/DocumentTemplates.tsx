import { useDocumentStore } from '../../store/documentStore'

interface Props {
  onClose: () => void
  onSelect: (title: string, content: object) => void
}

interface Template {
  id: string
  name: string
  icon: string
  description: string
  content: object
}

const TEMPLATES: Template[] = [
  {
    id: 'novel',
    name: '小说',
    icon: '📖',
    description: '长篇小说创作模板，含章节结构',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '小说标题' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '作者：你的名字' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '第一章 标题' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '在这里开始你的故事...' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '第一节' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '场景描写和人物对话...' }] },
      ],
    },
  },
  {
    id: 'essay',
    name: '散文',
    icon: '📝',
    description: '散文随笔创作模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '散文标题' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '开头引入...' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '正文展开...' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '结尾升华...' }] },
      ],
    },
  },
  {
    id: 'poetry',
    name: '诗歌',
    icon: '🎭',
    description: '现代诗歌创作模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '诗歌标题' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '第一句' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '第二句' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '第三句' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '第四句' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '第二节...' }] },
      ],
    },
  },
  {
    id: 'screenplay',
    name: '剧本',
    icon: '🎬',
    description: '影视剧本创作模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '剧本标题' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '编剧：你的名字' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '第一幕' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '场景：内景/外景 - 地点 - 时间' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '（场景描述）' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '角色名' }], marks: [{ type: 'bold' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '台词内容...' }] },
      ],
    },
  },
  {
    id: 'note',
    name: '笔记',
    icon: '📋',
    description: '读书笔记/学习笔记模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '笔记标题' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '日期：' + new Date().toLocaleDateString('zh-CN') }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '核心要点' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '要点1' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '要点2' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '详细内容' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '记录详细信息...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '个人思考' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '我的理解和想法...' }] },
      ],
    },
  },
  {
    id: 'diary',
    name: '日记',
    icon: '📔',
    description: '每日日记模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '今天做了什么' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '今天的心情' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '明天的计划' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
      ],
    },
  },
  {
    id: 'fanfic',
    name: '同人文',
    icon: '💫',
    description: '同人小说创作模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '同人文标题' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '原作：xxx | CP：xxx' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '标签：xxx, xxx, xxx' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '第一章' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '正文开始...' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '作者有话说' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'OOC致歉，欢迎交流...' }] },
      ],
    },
  },
  {
    id: 'webnovel',
    name: '网文',
    icon: '🌐',
    description: '网络小说连载模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '小说名' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '简介：一句话概括故事...' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '第1章 章节标题' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '正文...' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '（本章完）' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '下一章预告：...' }] },
      ],
    },
  },
  {
    id: 'fanfic-scene',
    name: '同人场景',
    icon: '🎭',
    description: '同人场景描写模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '场景标题' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '角色：xxx, xxx' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '环境描写' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '场景氛围...' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '人物互动' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '对话和动作...' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '内心独白' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '心理活动...' }] },
      ],
    },
  },
  {
    id: 'webnovel-character',
    name: '网文人物卡',
    icon: '👤',
    description: '网络小说人物设定模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '人物设定卡' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '基本信息' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '姓名：' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '年龄：' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '身份：' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '外貌：' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '性格特点' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '背景故事' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '能力/技能' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '...' }] },
      ],
    },
  },
  {
    id: 'webnovel-worldbuilding',
    name: '网文世界观',
    icon: '🌍',
    description: '网络小说世界观设定模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '世界观设定' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '世界背景' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '时代、地点、环境...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '力量体系' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '修炼/魔法/科技体系...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '势力分布' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '国家/门派/组织...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '重要规则' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '世界运行规则...' }] },
      ],
    },
  },
  {
    id: 'screenplay-scene',
    name: '剧本场景',
    icon: '🎥',
    description: '影视剧本场景模板',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '场景标题' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '内景/外景 - 地点 - 时间' }], marks: [{ type: 'bold' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '（场景描述，环境氛围）' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '角色1' }], marks: [{ type: 'bold' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '（动作）台词内容。' }] },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text: '角色2' }], marks: [{ type: 'bold' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '（动作）台词内容。' }] },
      ],
    },
  },
]

export default function DocumentTemplates({ onClose, onSelect }: Props) {
  const handleSelect = (template: Template) => {
    onSelect(template.name + ' - ' + new Date().toLocaleDateString('zh-CN'), template.content)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-surface border border-editor-border rounded-lg shadow-2xl w-[500px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">📝 文档模板</h2>
          <button onClick={onClose} className="text-editor-muted hover:text-editor-text">✕</button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className="w-full text-left p-4 bg-editor-bg rounded-lg border border-editor-border hover:border-editor-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div>
                  <div className="text-sm font-medium text-editor-text">{template.name}</div>
                  <div className="text-xs text-editor-muted mt-1">{template.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-editor-border">
          <button className="w-full text-xs text-editor-muted px-3 py-2 rounded hover:bg-editor-bg" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
