import { useState } from 'react'
import { useWordGoalStore } from '../../store/wordGoalStore'

interface Props {
  onClose?: () => void
}

export default function WordGoalPanel({ onClose }: Props) {
  const {
    goals,
    progress,
    setDailyGoal,
    setChapterGoal,
    setNovelGoal,
    resetDailyProgress,
    resetChapterProgress,
    resetNovelProgress,
    getDailyPercent,
    getChapterPercent,
    getNovelPercent,
  } = useWordGoalStore()

  const [editingGoal, setEditingGoal] = useState<'daily' | 'chapter' | 'novel' | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleSaveGoal = (type: 'daily' | 'chapter' | 'novel') => {
    const value = parseInt(editValue, 10)
    if (!isNaN(value) && value >= 0) {
      switch (type) {
        case 'daily':
          setDailyGoal(value)
          break
        case 'chapter':
          setChapterGoal(value)
          break
        case 'novel':
          setNovelGoal(value)
          break
      }
    }
    setEditingGoal(null)
  }

  const ProgressBar = ({
    current,
    goal,
    percent,
    color,
  }: {
    current: number
    goal: number
    percent: number
    color: string
  }) => (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-editor-muted">
          {current.toLocaleString()} / {goal.toLocaleString()} 字
        </span>
        <span className="text-editor-accent font-medium">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-editor-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  )

  const GoalRow = ({
    title,
    type,
    current,
    goal,
    percent,
    color,
    onReset,
  }: {
    title: string
    type: 'daily' | 'chapter' | 'novel'
    current: number
    goal: number
    percent: number
    color: string
    onReset: () => void
  }) => (
    <div className="p-3 bg-editor-bg rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-editor-text">{title}</span>
        <div className="flex items-center gap-2">
          {editingGoal === type ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-2 py-0.5 text-xs bg-editor-surface border border-editor-border rounded text-editor-text"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGoal(type)
                  if (e.key === 'Escape') setEditingGoal(null)
                }}
              />
              <button
                onClick={() => handleSaveGoal(type)}
                className="text-xs text-green-500 hover:text-green-400"
              >
                ✓
              </button>
              <button
                onClick={() => setEditingGoal(null)}
                className="text-xs text-red-500 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditingGoal(type)
                  setEditValue(String(goal))
                }}
                className="text-xs text-editor-muted hover:text-editor-text"
                title="修改目标"
              >
                ✏️
              </button>
              <button
                onClick={onReset}
                className="text-xs text-editor-muted hover:text-editor-text"
                title="重置进度"
              >
                🔄
              </button>
            </>
          )}
        </div>
      </div>
      <ProgressBar current={current} goal={goal} percent={percent} color={color} />
      {percent >= 100 && (
        <div className="mt-2 text-xs text-green-500 text-center">
          🎉 目标已达成！
        </div>
      )}
    </div>
  )

  const dailyPercent = getDailyPercent()
  const chapterPercent = getChapterPercent()
  const novelPercent = getNovelPercent()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-surface border border-editor-border rounded-lg shadow-2xl w-96 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">📊 字数目标</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-editor-muted hover:text-editor-text"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-4 space-y-3">
          <GoalRow
            title="📅 今日目标"
            type="daily"
            current={progress.daily}
            goal={goals.daily}
            percent={dailyPercent}
            color="bg-blue-500"
            onReset={resetDailyProgress}
          />

          <GoalRow
            title="📖 章节目标"
            type="chapter"
            current={progress.chapter}
            goal={goals.chapter}
            percent={chapterPercent}
            color="bg-purple-500"
            onReset={resetChapterProgress}
          />

          <GoalRow
            title="📚 小说总目标"
            type="novel"
            current={progress.novel}
            goal={goals.novel}
            percent={novelPercent}
            color="bg-green-500"
            onReset={resetNovelProgress}
          />
        </div>

        <div className="px-4 py-3 border-t border-editor-border bg-editor-bg/50">
          <div className="flex items-center justify-between text-xs text-editor-muted">
            <span>
              今日: {progress.daily.toLocaleString()} 字 | 
              章节: {progress.chapter.toLocaleString()} 字 | 
              总计: {progress.novel.toLocaleString()} 字
            </span>
            {dailyPercent >= 100 && chapterPercent >= 100 && novelPercent >= 100 && (
              <span className="text-yellow-500">🏆 全部达成！</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
