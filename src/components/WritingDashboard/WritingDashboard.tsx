import { useMemo } from 'react'
import { useWritingStatsStore } from '../../store/writingStatsStore'
import { useWordGoalStore } from '../../store/wordGoalStore'
import { useWordCountStore } from '../../store/wordCountStore'

interface Props {
  onClose: () => void
}

function CircularProgress({ percent, size = 64, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-editor-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-editor-accent transition-all duration-500"
      />
    </svg>
  )
}

export default function WritingDashboard({ onClose }: Props) {
  const { dailyStats } = useWritingStatsStore()
  const { goals, progress } = useWordGoalStore()
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
    if (hours > 0) return `${hours}h${mins}m`
    return `${mins}m`
  }

  const dailyGoal = goals.daily
  const dailyProgressPercent = dailyGoal > 0 ? Math.min((todayStats.wordsWritten / dailyGoal) * 100, 100) : 0

  const weeklyGoal = goals.daily * 7
  const weeklyProgressPercent = weeklyGoal > 0 ? Math.min((weeklyTotal / weeklyGoal) * 100, 100) : 0

  const streak = useMemo(() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (dailyStats[key]?.wordsWritten && dailyStats[key].wordsWritten > 0) {
        count++
      } else if (i > 0) {
        break
      }
    }
    return count
  }, [dailyStats])

  return (
    <div className="bg-editor-surface border border-editor-border rounded-2xl shadow-2xl p-6 w-96">
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
          <div className="flex items-center gap-4">
            <div className="relative">
              <CircularProgress percent={dailyProgressPercent} size={72} strokeWidth={6} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-editor-text">{Math.round(dailyProgressPercent)}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-editor-muted mb-1">今日目标</div>
              <div className="text-sm font-semibold text-editor-text">
                {todayStats.wordsWritten.toLocaleString()} / {dailyGoal.toLocaleString()}
              </div>
              <div className="text-[10px] text-editor-muted mt-1">
                {dailyProgressPercent >= 100 ? '🎉 已完成！' : `还差 ${(dailyGoal - todayStats.wordsWritten).toLocaleString()} 字`}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-editor-accent">{todayStats.wordsWritten.toLocaleString()}</p>
            <p className="text-[10px] text-editor-muted">今日字数</p>
          </div>
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-editor-accent">{formatTime(todayStats.timeSpent)}</p>
            <p className="text-[10px] text-editor-muted">今日时长</p>
          </div>
        </div>

        <div className="bg-editor-bg rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-editor-muted">本周进度</span>
            <span className="text-xs text-editor-accent">
              {weeklyTotal.toLocaleString()} / {weeklyGoal.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-editor-border rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${weeklyProgressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-editor-muted">{Math.round(weeklyProgressPercent)}%</span>
            <span className="text-[10px] text-editor-muted">{formatTime(weeklyStats.reduce((s, d) => s + (d?.timeSpent || 0), 0))}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-editor-bg rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-green-500">{weeklyTotal.toLocaleString()}</p>
            <p className="text-[10px] text-editor-muted">本周</p>
          </div>
          <div className="bg-editor-bg rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-blue-500">{monthlyTotal.toLocaleString()}</p>
            <p className="text-[10px] text-editor-muted">本月</p>
          </div>
          <div className="bg-editor-bg rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-orange-500">{totalCount.toLocaleString()}</p>
            <p className="text-[10px] text-editor-muted">总计</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-editor-bg rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-editor-accent">{streak}</p>
            <p className="text-[10px] text-editor-muted">连续天数</p>
          </div>
          <div className="bg-editor-bg rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-editor-accent">{todayStats.sessionsCount}</p>
            <p className="text-[10px] text-editor-muted">今日次数</p>
          </div>
          <div className="bg-editor-bg rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-editor-accent">
              {todayStats.timeSpent > 0 ? Math.round(todayStats.wordsWritten / (todayStats.timeSpent / 60)) : 0}
            </p>
            <p className="text-[10px] text-editor-muted">字/分钟</p>
          </div>
        </div>
      </div>
    </div>
  )
}
