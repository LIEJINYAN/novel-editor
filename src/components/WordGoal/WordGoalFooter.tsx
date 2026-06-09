import { useWordGoalStore } from '../../store/wordGoalStore'

export default function WordGoalFooter() {
  const { goals, progress, getDailyPercent } = useWordGoalStore()
  const dailyPercent = getDailyPercent()

  if (goals.daily === 0) return null

  return (
    <div className="flex items-center gap-2" title={`今日目标: ${progress.daily}/${goals.daily}`}>
      <div className="w-16 h-1.5 bg-editor-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            dailyPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(100, dailyPercent)}%` }}
        />
      </div>
      <span className="text-[10px] text-editor-muted">
        {progress.daily.toLocaleString()}/{goals.daily.toLocaleString()}
      </span>
    </div>
  )
}
