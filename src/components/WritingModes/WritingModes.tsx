import { useState } from 'react'
import { useThemeStore } from '../../store/themeStore'
import { useWordGoalStore } from '../../store/wordGoalStore'
import { useAutoSaveStore } from '../../store/autoSaveStore'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
}

interface WritingMode {
  id: string
  name: string
  icon: string
  description: string
  settings: {
    wordWrap: boolean
    dailyGoal: number
    saveStrategy: 'auto' | 'smart' | 'manual'
  }
}

const WRITING_MODES: WritingMode[] = [
  { id: 'novel', name: '小说模式', icon: '📖', description: '适合长篇创作，自动保存，每日目标2000字', settings: { wordWrap: true, dailyGoal: 2000, saveStrategy: 'smart' } },
  { id: 'essay', name: '散文模式', icon: '📄', description: '适合散文随笔，自动保存，每日目标1000字', settings: { wordWrap: true, dailyGoal: 1000, saveStrategy: 'auto' } },
  { id: 'poetry', name: '诗歌模式', icon: '🎭', description: '适合诗歌创作，手动保存，每日目标500字', settings: { wordWrap: false, dailyGoal: 500, saveStrategy: 'manual' } },
  { id: 'note', name: '笔记模式', icon: '📋', description: '适合快速记录，自动保存，无字数目标', settings: { wordWrap: true, dailyGoal: 0, saveStrategy: 'auto' } },
  { id: 'focus', name: '沉浸模式', icon: '🎯', description: '专注写作，自动保存，无干扰', settings: { wordWrap: true, dailyGoal: 0, saveStrategy: 'smart' } },
]

const STORAGE_KEY = 'novel-engine-writing-mode'

function getCurrentMode(): string {
  try { return localStorage.getItem(STORAGE_KEY) || 'novel' }
  catch { return 'novel' }
}

function setCurrentMode(modeId: string) {
  try { localStorage.setItem(STORAGE_KEY, modeId) } catch {}
}

export default function WritingModes({ onClose }: Props) {
  const [currentMode, setCurrentModeState] = useState(getCurrentMode)
  const { toggleWordWrap } = useThemeStore()
  const { setDailyGoal } = useWordGoalStore()
  const { setStrategy } = useAutoSaveStore()

  const applyMode = (mode: WritingMode) => {
    setCurrentModeState(mode.id)
    setCurrentMode(mode.id)
    if (mode.settings.wordWrap) {
      const wordWrap = useThemeStore.getState().wordWrap
      if (!wordWrap) toggleWordWrap()
    }
    setDailyGoal(mode.settings.dailyGoal)
    setStrategy(mode.settings.saveStrategy)
  }

  return (
    <Modal open={true} onClose={onClose} title="✍️ 写作模式" size="md">
      <div className="p-4 space-y-3">
        {WRITING_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => applyMode(mode)}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              currentMode === mode.id
                ? 'border-editor-accent bg-editor-accent/10'
                : 'border-editor-border hover:border-editor-accent/50 hover:bg-editor-bg/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{mode.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-editor-text">{mode.name}</span>
                  {currentMode === mode.id && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-editor-accent text-editor-bg rounded">当前</span>
                  )}
                </div>
                <p className="text-xs text-editor-muted mt-1">{mode.description}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-[10px] text-editor-muted">
              <span>换行: {mode.settings.wordWrap ? '开启' : '关闭'}</span>
              <span>•</span>
              <span>目标: {mode.settings.dailyGoal > 0 ? `${mode.settings.dailyGoal}字/日` : '无'}</span>
              <span>•</span>
              <span>保存: {mode.settings.saveStrategy === 'auto' ? '自动' : mode.settings.saveStrategy === 'smart' ? '智能' : '手动'}</span>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}
