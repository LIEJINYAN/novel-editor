import { useMemo } from 'react'
import { useWritingStatsStore } from '../../store/writingStatsStore'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
}

export default function WritingHeatmap({ onClose }: Props) {
  const { dailyStats } = useWritingStatsStore()

  const heatmapData = useMemo(() => {
    const weeks = 12
    const data: { date: string; words: number; level: number }[] = []
    const now = new Date()
    for (let w = weeks - 1; w >= 0; w--) {
      for (let d = 6; d >= 0; d--) {
        const date = new Date(now)
        date.setDate(date.getDate() - (w * 7 + d))
        const key = date.toISOString().slice(0, 10)
        const words = dailyStats[key]?.wordsWritten || 0
        let level = 0
        if (words > 0) level = 1
        if (words >= 500) level = 2
        if (words >= 1000) level = 3
        if (words >= 2000) level = 4
        data.push({ date: key, words, level })
      }
    }
    return data
  }, [dailyStats])

  const getColor = (level: number) => {
    const colors = [
      'bg-editor-surface',
      'bg-green-200 dark:bg-green-900',
      'bg-green-300 dark:bg-green-700',
      'bg-green-400 dark:bg-green-600',
      'bg-green-500 dark:bg-green-500',
    ]
    return colors[level]
  }

  const totalWords = heatmapData.reduce((s, d) => s + d.words, 0)
  const activeDays = heatmapData.filter((d) => d.words > 0).length
  const maxStreak = useMemo(() => {
    let streak = 0
    let maxStreak = 0
    for (const d of heatmapData) {
      if (d.words > 0) { streak++; maxStreak = Math.max(maxStreak, streak) }
      else { streak = 0 }
    }
    return maxStreak
  }, [heatmapData])

  return (
    <Modal open={true} onClose={onClose} title="📅 写作热力图" size="lg">
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-editor-accent">{totalWords.toLocaleString()}</div>
            <div className="text-[10px] text-editor-muted">总字数</div>
          </div>
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-500">{activeDays}</div>
            <div className="text-[10px] text-editor-muted">活跃天数</div>
          </div>
          <div className="bg-editor-bg rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-500">{maxStreak}</div>
            <div className="text-[10px] text-editor-muted">最长连续</div>
          </div>
        </div>

        <div className="bg-editor-bg rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-editor-muted">少</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`w-3 h-3 rounded-sm ${getColor(level)}`} />
            ))}
            <span className="text-xs text-editor-muted">多</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {heatmapData.map((d, i) => (
              <div
                key={i}
                className={`w-full aspect-square rounded-sm ${getColor(d.level)} cursor-pointer group relative`}
                title={`${d.date}: ${d.words}字`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-editor-surface border border-editor-border rounded px-2 py-1 text-[10px] text-editor-text opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {d.date}: {d.words}字
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
