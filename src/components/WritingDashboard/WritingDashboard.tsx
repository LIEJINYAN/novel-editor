import { useWritingStatsStore } from '../../store/writingStatsStore'
import { useWordGoalStore } from '../../store/wordGoalStore'
import { useWordCountStore } from '../../store/wordCountStore'

interface Props {
  onClose: () => void
}

export default function WritingDashboard({ onClose }: Props) {
  const { dailyStats } = useWritingStatsStore()
  const { goals } = useWordGoalStore()
  const { totalCount } = useWordCountStore()

  const today = new Date().toISOString().split('T')[0]
  const todayStats = dailyStats[today] || { wordsWritten: 0, timeSpent: 0, sessionsCount: 0 }

  const weeklyStats = useWritingStatsStore((s) => s.getWeekStats())
  const monthlyStats = useWritingStatsStore((s) => s.getMonthStats())

  const weeklyTotal = weeklyStats.reduce((sum, s) => sum + (s?.wordsWritten || 0), 0)
  const monthlyTotal = monthlyStats.reduce((sum, s) => sum + (s?.wordsWritten || 0), 0)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}小时${mins}分钟`
    return `${mins}分钟`
  }

  const dailyGoal = goals.daily
  const dailyProgressPercent = dailyGoal > 0 ? Math.min((todayStats.wordsWritten / dailyGoal) * 100, 100) : 0

  return (
    <div className="bg-editor-surface border border-editor-border rounded-2xl shadow-2xl p-6 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-editor-text">📊 写作仪表盘</h3>
        <button
          onClick={onClose}
          className="text-editor-muted hover:text-editor-text text-sm"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-editor-bg rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-editor-muted">今日目标</span>
            <span className="text-xs text-editor-accent">
              {todayStats.wordsWritten} / {dailyGoal}
            </span>
          </div>
          <div className="w-full bg-editor-border rounded-full h-2">
            <div
              className="bg-editor-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${dailyProgressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-editor-muted mt-1">
            {dailyProgressPercent >= 100 ? '🎉 已完成今日目标！' : `还差 ${dailyGoal - todayStats.wordsWritten} 字`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-editor-accent">{todayStats.wordsWritten}</p>
            <p className="text-[10px] text-editor-muted">今日字数</p>
          </div>
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-editor-accent">{formatTime(todayStats.timeSpent)}</p>
            <p className="text-[10px] text-editor-muted">今日时长</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-editor-bg rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-editor-accent">{weeklyTotal}</p>
            <p className="text-[10px] text-editor-muted">本周</p>
          </div>
          <div className="bg-editor-bg rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-editor-accent">{monthlyTotal}</p>
            <p className="text-[10px] text-editor-muted">本月</p>
          </div>
          <div className="bg-editor-bg rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-editor-accent">{totalCount}</p>
            <p className="text-[10px] text-editor-muted">总计</p>
          </div>
        </div>
      </div>
    </div>
  )
}
