import { useState } from 'react'
import { useDocumentStore } from '../../store/documentStore'
import Modal from '../common/Modal'

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
    id: 'novel', name: '小说', icon: '📖', description: '长篇小说创作模板，含章节结构',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '小说标题' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '作者：你的名字' }] },
      { type: 'paragraph' },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '第一章 标题' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '在这里开始你的故事...' }] },
    ] },
  },
  {
    id: 'essay', name: '散文', icon: '📝', description: '散文随笔创作模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '散文标题' }] },
      { type: 'paragraph' },
      { type: 'paragraph', content: [{ type: 'text', text: '开头引入...' }] },
    ] },
  },
  {
    id: 'poetry', name: '诗歌', icon: '🎭', description: '现代诗歌创作模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '诗歌标题' }] },
      { type: 'paragraph' },
      { type: 'paragraph', content: [{ type: 'text', text: '第一句' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '第二句' }] },
    ] },
  },
  {
    id: 'screenplay', name: '剧本', icon: '🎬', description: '影视剧本创作模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '剧本标题' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '编剧：你的名字' }] },
      { type: 'paragraph' },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '第一幕' }] },
    ] },
  },
  {
    id: 'note', name: '笔记', icon: '📋', description: '读书笔记/学习笔记模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '笔记标题' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '核心要点' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '详细内容' }] },
    ] },
  },
  {
    id: 'diary', name: '日记', icon: '📔', description: '每日日记模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '今天做了什么' }] },
    ] },
  },
  {
    id: 'fanfic', name: '同人文', icon: '💫', description: '同人小说创作模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '同人文标题' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '原作：xxx | CP：xxx' }] },
    ] },
  },
  {
    id: 'webnovel', name: '网文', icon: '🌐', description: '网络小说连载模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '小说名' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '简介：一句话概括故事...' }] },
    ] },
  },
  {
    id: 'fanfic-scene', name: '同人场景', icon: '🎭', description: '同人场景描写模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '场景标题' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '环境描写' }] },
    ] },
  },
  {
    id: 'webnovel-character', name: '网文人物卡', icon: '👤', description: '网络小说人物设定模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '人物设定卡' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '基本信息' }] },
    ] },
  },
  {
    id: 'webnovel-worldbuilding', name: '网文世界观', icon: '🌍', description: '网络小说世界观设定模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '世界观设定' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '世界背景' }] },
    ] },
  },
  {
    id: 'screenplay-scene', name: '剧本场景', icon: '🎥', description: '影视剧本场景模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '场景标题' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '内景/外景 - 地点 - 时间' }], marks: [{ type: 'bold' }] },
    ] },
  },
  {
    id: 'novel-outline', name: '小说大纲', icon: '📋', description: '小说整体大纲规划模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '小说大纲' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '故事梗概' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '用200字概括整个故事...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '主要角色' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '章节规划' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '核心冲突' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '结局走向' }] },
    ] },
  },
  {
    id: 'character-setting', name: '人物设定', icon: '👤', description: '详细人物设定模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '人物设定' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '基本信息' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '姓名：\n年龄：\n性别：\n外貌：' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '性格特征' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '背景故事' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '人物关系' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '成长弧线' }] },
    ] },
  },
  {
    id: 'worldbuilding', name: '世界观设定', icon: '🌍', description: '完整世界观构建模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '世界观设定' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '时代背景' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '地理环境' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '社会制度' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '文化习俗' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '魔法/科技体系' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '历史大事' }] },
    ] },
  },
  {
    id: 'plot-structure', name: '情节结构', icon: '📈', description: '三幕式情节结构模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '情节结构' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '第一幕：建置' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '日常世界 → 激励事件 → 跨越门槛' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '第二幕：对抗' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '试炼与盟友 → 中点转折 → 一切尽失' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '第三幕：解决' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '高潮 → 结局 → 新常态' }] },
    ] },
  },
  {
    id: 'poem-modern', name: '现代诗', icon: '🌸', description: '现代诗歌创作模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '诗歌标题' }] },
      { type: 'paragraph' },
      { type: 'paragraph', content: [{ type: 'text', text: '第一诗节' }] },
      { type: 'paragraph' },
      { type: 'paragraph', content: [{ type: 'text', text: '第二诗节' }] },
      { type: 'paragraph' },
      { type: 'paragraph', content: [{ type: 'text', text: '第三诗节' }] },
    ] },
  },
  {
    id: 'academic', name: '学术论文', icon: '🎓', description: '学术论文写作模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '论文标题' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '摘要' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '关键词' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '引言' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '文献综述' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '研究方法' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '结果与讨论' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '结论' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '参考文献' }] },
    ] },
  },
  {
    id: 'short-story', name: '短篇小说', icon: '📚', description: '短篇小说创作模板',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '短篇标题' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '开头' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '引人入胜的第一段...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '发展' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '高潮' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '结局' }] },
    ] },
  },
]

export default function DocumentTemplates({ onClose, onSelect }: Props) {
  const handleSelect = (template: Template) => {
    onSelect(template.name + ' - ' + new Date().toLocaleDateString('zh-CN'), template.content)
    onClose()
  }

  return (
    <Modal open={true} onClose={onClose} title="📝 文档模板" size="md">
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
    </Modal>
  )
}
