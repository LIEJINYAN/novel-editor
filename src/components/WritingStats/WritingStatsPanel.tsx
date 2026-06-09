import { useWritingStatsStore } from '../../store/writingStatsStore'
import { t } from '../../i18n'

interface Props {
  onClose: () => void
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export default function WritingStatsPanel({ onClose }: Props) {
  const { getTodayStats, getWeekStats, getMonthStats } = useWritingStatsStore()
  const todayStats = getTodayStats()
  const weekStats = getWeekStats()
  const monthStats = getMonthStats()

  const weekTotalWords = weekStats.reduce((sum, s) => sum + s.wordsWritten, 0)
  const weekTotalTime = weekStats.reduce((sum, s) => sum + s.timeSpent, 0)
  const monthTotalWords = monthStats.reduce((sum, s) => sum + s.wordsWritten, 0)
  const monthTotalTime = monthStats.reduce((sum, s) => sum + s.timeSpent, 0)
  const maxWeekWords = Math.max(...weekStats.map((s) => s.wordsWritten), 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-editor-surface border border-editor-border rounded-lg shadow-xl w-[500px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text">📈 {t('writingStats.title')}</h2>
          <button className="text-editor-muted hover:text-editor-text" onClick={onClose}>✕</button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-editor-muted uppercase tracking-wider mb-3">今日</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-editor-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-editor-accent">{todayStats.wordsWritten}</div>
                <div className="text-xs text-editor-muted mt-1">{t('writingStats.totalWords')}</div>
              </div>
              <div className="bg-editor-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-editor-accent">{formatTime(todayStats.timeSpent)}</div>
                <div className="text-xs text-editor-muted mt-1">时长</div>
              </div>
              <div className="bg-editor-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-editor-accent">{todayStats.sessionsCount}</div>
                <div className="text-xs text-editor-muted mt-1">次数</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-editor-muted uppercase tracking-wider">本周</h3>
              <span className="text-xs text-editor-muted">{weekTotalWords} 字 / {formatTime(weekTotalTime)}</span>
            </div>
            <div className="bg-editor-bg rounded-lg p-3">
              <div className="flex items-end gap-1 h-20">
                {weekStats.map((stat) => (
                  <div key={stat.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-editor-accent rounded-t" style={{ height: `${Math.max((stat.wordsWritten / maxWeekWords) * 60, 2)}px` }} />
                    <span className="text-[10px] text-editor-muted">{formatDate(stat.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-editor-muted uppercase tracking-wider">本月</h3>
              <span className="text-xs text-editor-muted">{monthTotalWords} 字 / {formatTime(monthTotalTime)}</span>
            </div>
            <div className="bg-editor-bg rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-editor-muted">{t('writingStats.totalWords')}</span>
                <span className="text-editor-text font-medium">{monthTotalWords}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-editor-muted">总时长</span>
                <span className="text-editor-text font-medium">{formatTime(monthTotalTime)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-editor-muted">日均字数</span>
                <span className="text-editor-text font-medium">{Math.round(monthTotalWords / 30)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-editor-muted">日均时长</span>
                <span className="text-editor-text font-medium">{formatTime(Math.round(monthTotalTime / 30))}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-editor-muted">{t('writingStats.activeDays')}</span>
                <span className="text-editor-text font-medium">{monthStats.filter((s) => s.wordsWritten > 0).length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-editor-border flex justify-end">
          <button className="px-3 py-1.5 bg-editor-accent text-white text-xs rounded hover:opacity-90" onClick={onClose}>{t('editor.close')}</button>
        </div>
      </div>
    </div>
  )
}
