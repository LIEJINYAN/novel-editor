import { usePomodoro } from '../../hooks/usePomodoro'
import { useWordCountStore } from '../../store/wordCountStore'

interface Props {
  onClose: () => void
}

export default function PomodoroTimer({ onClose }: Props) {
  const pomodoro = usePomodoro()
  const { currentCount } = useWordCountStore()

  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference * (1 - pomodoro.progress)

  return (
    <div className="bg-editor-surface border border-editor-border rounded-2xl shadow-2xl p-6 w-72">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-editor-text">🍅 番茄钟</h3>
        <button
          onClick={onClose}
          className="text-editor-muted hover:text-editor-text text-sm"
        >
          ×
        </button>
      </div>

      <div className="flex justify-center mb-4">
        <div className="relative">
          <svg className="w-32 h-32 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-editor-border"
            />
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-editor-accent transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono text-editor-text">
              {pomodoro.formatTime(pomodoro.timeLeft)}
            </span>
            <span className="text-[10px] text-editor-muted">
              {pomodoro.isBreak ? '休息时间' : '专注时间'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        {!pomodoro.isRunning ? (
          <button
            onClick={pomodoro.start}
            className="px-4 py-2 bg-editor-accent text-editor-bg text-xs rounded-lg hover:opacity-90"
          >
            ▶ 开始
          </button>
        ) : (
          <button
            onClick={pomodoro.pause}
            className="px-4 py-2 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600"
          >
            ⏸ 暂停
          </button>
        )}
        <button
          onClick={pomodoro.reset}
          className="px-4 py-2 bg-editor-bg border border-editor-border text-editor-text text-xs rounded-lg hover:border-editor-accent"
        >
          ↺ 重置
        </button>
        <button
          onClick={pomodoro.skip}
          className="px-4 py-2 bg-editor-bg border border-editor-border text-editor-text text-xs rounded-lg hover:border-editor-accent"
        >
          ⏭ 跳过
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-editor-bg rounded-lg p-2">
          <p className="text-lg font-semibold text-editor-accent">{pomodoro.sessions}</p>
          <p className="text-[10px] text-editor-muted">已完成番茄</p>
        </div>
        <div className="bg-editor-bg rounded-lg p-2">
          <p className="text-lg font-semibold text-editor-accent">{currentCount}</p>
          <p className="text-[10px] text-editor-muted">本次字数</p>
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-[10px] text-editor-muted">
          总专注: {Math.floor(pomodoro.totalFocusTime / 60)} 分钟
        </p>
      </div>
    </div>
  )
}
