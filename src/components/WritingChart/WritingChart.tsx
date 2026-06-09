import { useMemo } from 'react'
import { useWritingStatsStore } from '../../store/writingStatsStore'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
}

export default function WritingChart({ onClose }: Props) {
  const { dailyStats } = useWritingStatsStore()

  const chartData = useMemo(() => {
    const days = 30
    const data: { date: string; words: number; time: number }[] = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      data.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        words: dailyStats[key]?.wordsWritten || 0,
        time: dailyStats[key]?.timeSpent || 0,
      })
    }
    return data
  }, [dailyStats])

  const maxWords = Math.max(...chartData.map((d) => d.words), 1)
  const totalWords = chartData.reduce((s, d) => s + d.words, 0)
  const totalTime = chartData.reduce((s, d) => s + d.time, 0)
  const activeDays = chartData.filter((d) => d.words > 0).length
  const avgWords = activeDays > 0 ? Math.round(totalWords / activeDays) : 0

  return (
    <Modal open={true} onClose={onClose} title="📊 写作数据可视化" size="lg">
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-editor-accent">{totalWords.toLocaleString()}</div>
            <div className="text-[10px] text-editor-muted">30天总字数</div>
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
            <div className="text-lg font-bold text-orange-500">{Math.round(totalTime / 60)}m</div>
            <div className="text-[10px] text-editor-muted">总时长</div>
          </div>
        </div>

        <div className="bg-editor-bg rounded-lg p-4">
          <h3 className="text-xs font-medium text-editor-muted mb-3">每日字数趋势（30天）</h3>
          <div className="flex items-end gap-[2px] h-32">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute -top-8 bg-editor-surface border border-editor-border rounded px-2 py-1 text-[10px] text-editor-text opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {d.date}: {d.words}字
                </div>
                <div
                  className="w-full bg-editor-accent rounded-t transition-all hover:opacity-80 min-h-[1px]"
                  style={{ height: `${(d.words / maxWords) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-editor-muted">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[chartData.length - 1]?.date}</span>
          </div>
        </div>

        <div className="mt-3 bg-editor-bg rounded-lg p-3">
          <h3 className="text-xs font-medium text-editor-muted mb-2">时间分布</h3>
          <div className="flex items-end gap-[2px] h-16">
            {chartData.map((d, i) => (
              <div
                key={i}
                className="flex-1 bg-orange-400 rounded-t hover:opacity-80 min-h-[1px]"
                style={{ height: `${(d.time / Math.max(...chartData.map((x) => x.time), 1)) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
