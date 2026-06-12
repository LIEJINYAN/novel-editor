import { useMemo, useState } from 'react'
import { useWritingStatsStore } from '../../store/writingStatsStore'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
}

type TimeRange = '7' | '14' | '30'

export default function WritingChart({ onClose }: Props) {
  const { dailyStats } = useWritingStatsStore()
  const [timeRange, setTimeRange] = useState<TimeRange>('30')
  const [showMovingAverage, setShowMovingAverage] = useState(true)

  const days = parseInt(timeRange)

  const chartData = useMemo(() => {
    const data: { date: string; words: number; time: number; weekday: string }[] = []
    const now = new Date()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      data.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        words: dailyStats[key]?.wordsWritten || 0,
        time: dailyStats[key]?.timeSpent || 0,
        weekday: weekdays[d.getDay()],
      })
    }
    return data
  }, [dailyStats, days])

  const movingAverage = useMemo(() => {
    if (!showMovingAverage) return []
    const window = 7
    return chartData.map((_, i) => {
      const start = Math.max(0, i - window + 1)
      const slice = chartData.slice(start, i + 1)
      const avg = slice.reduce((sum, d) => sum + d.words, 0) / slice.length
      return avg
    })
  }, [chartData, showMovingAverage])

  const maxWords = Math.max(...chartData.map((d) => d.words), 1)
  const totalWords = chartData.reduce((s, d) => s + d.words, 0)
  const totalTime = chartData.reduce((s, d) => s + d.time, 0)
  const activeDays = chartData.filter((d) => d.words > 0).length
  const avgWords = activeDays > 0 ? Math.round(totalWords / activeDays) : 0

  const thisWeek = chartData.slice(-7)
  const lastWeek = chartData.slice(-14, -7)
  const thisWeekTotal = thisWeek.reduce((s, d) => s + d.words, 0)
  const lastWeekTotal = lastWeek.reduce((s, d) => s + d.words, 0)
  const weekChange = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0

  const weekdayStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {}
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    weekdays.forEach((w) => { stats[w] = { total: 0, count: 0 } })
    chartData.forEach((d) => {
      stats[d.weekday].total += d.words
      stats[d.weekday].count++
    })
    return weekdays.map((w) => ({
      weekday: w,
      avg: stats[w].count > 0 ? Math.round(stats[w].total / stats[w].count) : 0,
    }))
  }, [chartData])

  const maxWeekdayAvg = Math.max(...weekdayStats.map((d) => d.avg), 1)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h${mins}m`
    return `${mins}m`
  }

  return (
    <Modal open={true} onClose={onClose} title="📊 写作数据可视化" size="lg">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          {(['7', '14', '30'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs rounded ${
                timeRange === range ? 'bg-editor-accent text-editor-bg' : 'text-editor-muted hover:text-editor-text hover:bg-editor-surface'
              }`}
            >
              {range}天
            </button>
          ))}
          <div className="flex-1" />
          <label className="flex items-center gap-1.5 text-xs text-editor-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showMovingAverage}
              onChange={(e) => setShowMovingAverage(e.target.checked)}
              className="w-3 h-3 rounded border-editor-border"
            />
            7日均线
          </label>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-editor-accent">{totalWords.toLocaleString()}</div>
            <div className="text-[10px] text-editor-muted">{days}天总字数</div>
          </div>
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-500">{avgWords.toLocaleString()}</div>
            <div className="text-[10px] text-editor-muted">日均字数</div>
          </div>
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-500">{activeDays}</div>
            <div className="text-[10px] text-editor-muted">写作天数</div>
          </div>
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-500">{formatTime(totalTime)}</div>
            <div className="text-[10px] text-editor-muted">总时长</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-editor-bg rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-editor-muted">本周 vs 上周</span>
              <span className={`text-xs font-medium ${weekChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {weekChange >= 0 ? '+' : ''}{weekChange}%
              </span>
            </div>
            <div className="flex items-end gap-2 h-8">
              <div className="flex-1">
                <div className="text-[10px] text-editor-muted mb-1">本周</div>
                <div className="bg-editor-accent rounded-t h-4" style={{ width: '100%' }} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-editor-muted mb-1">上周</div>
                <div className="bg-editor-border rounded-t h-4" style={{ width: `${lastWeekTotal > 0 ? (lastWeekTotal / thisWeekTotal) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-editor-bg rounded-lg p-3">
            <div className="text-xs text-editor-muted mb-2">写作效率</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-sm font-semibold text-editor-accent">{formatTime(activeDays > 0 ? totalTime / activeDays : 0)}</div>
                <div className="text-[10px] text-editor-muted">日均时长</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-editor-accent">{totalTime > 0 ? Math.round(totalWords / (totalTime / 60)) : 0}</div>
                <div className="text-[10px] text-editor-muted">字/分钟</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-editor-bg rounded-lg p-4 mb-4">
          <h3 className="text-xs font-medium text-editor-muted mb-3">每日字数趋势</h3>
          <div className="relative h-40">
            <div className="absolute inset-0 flex items-end gap-[2px]">
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-10 bg-editor-surface border border-editor-border rounded px-2 py-1 text-[10px] text-editor-text opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {d.date} ({d.weekday}): {d.words}字
                  </div>
                  <div
                    className="w-full bg-editor-accent/60 rounded-t transition-all hover:bg-editor-accent min-h-[1px]"
                    style={{ height: `${(d.words / maxWords) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            {showMovingAverage && (
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth="2"
                  points={movingAverage.map((avg, i) => {
                    const x = (i / (chartData.length - 1)) * 100
                    const y = 100 - (avg / maxWords) * 100
                    return `${x}%,${y}%`
                  }).join(' ')}
                />
              </svg>
            )}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-editor-muted">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[chartData.length - 1]?.date}</span>
          </div>
        </div>

        <div className="bg-editor-bg rounded-lg p-4">
          <h3 className="text-xs font-medium text-editor-muted mb-3">每周写作频率</h3>
          <div className="flex items-end gap-2 h-20">
            {weekdayStats.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-editor-muted">{d.avg}</div>
                <div
                  className="w-full bg-blue-400 rounded-t min-h-[1px]"
                  style={{ height: `${(d.avg / maxWeekdayAvg) * 100}%` }}
                />
                <div className="text-[10px] text-editor-muted">{d.weekday}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
