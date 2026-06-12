import { useState } from 'react'
import { usePomodoro } from '../../hooks/usePomodoro'
import { useWordCountStore } from '../../store/wordCountStore'

interface Props {
  onClose: () => void
}

export default function PomodoroTimer({ onClose }: Props) {
  const pomodoro = usePomodoro()
  const { currentCount } = useWordCountStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference * (1 - pomodoro.progress)
  const todayStats = pomodoro.getTodayStats()

  return (
    <div className="bg-editor-surface border border-editor-border rounded-2xl shadow-2xl p-6 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-editor-text">🍅 番茄钟</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-editor-muted hover:text-editor-text text-sm"
            title="统计"
          >
            📊
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-editor-muted hover:text-editor-text text-sm"
            title="设置"
          >
            ⚙️
          </button>
          <button
            onClick={onClose}
            className="text-editor-muted hover:text-editor-text text-sm"
          >
            ×
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-[10px] text-editor-muted">专注时长 (分钟)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={Math.floor(pomodoro.config.focusDuration / 60)}
              onChange={(e) => pomodoro.updateConfig({ focusDuration: parseInt(e.target.value) * 60 })}
              className="w-full bg-editor-bg text-editor-text text-sm px-3 py-1.5 rounded border border-editor-border outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-editor-muted">短休息时长 (分钟)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={Math.floor(pomodoro.config.shortBreakDuration / 60)}
              onChange={(e) => pomodoro.updateConfig({ shortBreakDuration: parseInt(e.target.value) * 60 })}
              className="w-full bg-editor-bg text-editor-text text-sm px-3 py-1.5 rounded border border-editor-border outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-editor-muted">长休息时长 (分钟)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={Math.floor(pomodoro.config.longBreakDuration / 60)}
              onChange={(e) => pomodoro.updateConfig({ longBreakDuration: parseInt(e.target.value) * 60 })}
              className="w-full bg-editor-bg text-editor-text text-sm px-3 py-1.5 rounded border border-editor-border outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-editor-muted">几个番茄后长休息</label>
            <input
              type="number"
              min={2}
              max={10}
              value={pomodoro.config.sessionsBeforeLongBreak}
              onChange={(e) => pomodoro.updateConfig({ sessionsBeforeLongBreak: parseInt(e.target.value) })}
              className="w-full bg-editor-bg text-editor-text text-sm px-3 py-1.5 rounded border border-editor-border outline-none"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-[10px] text-editor-muted">
              <input
                type="checkbox"
                checked={pomodoro.config.autoStartBreak}
                onChange={(e) => pomodoro.updateConfig({ autoStartBreak: e.target.checked })}
                className="rounded"
              />
              自动开始休息
            </label>
            <label className="flex items-center gap-2 text-[10px] text-editor-muted">
              <input
                type="checkbox"
                checked={pomodoro.config.autoStartFocus}
                onChange={(e) => pomodoro.updateConfig({ autoStartFocus: e.target.checked })}
                className="rounded"
              />
              自动开始专注
            </label>
          </div>
          <label className="flex items-center gap-2 text-[10px] text-editor-muted">
            <input
              type="checkbox"
              checked={pomodoro.config.soundEnabled}
              onChange={(e) => pomodoro.updateConfig({ soundEnabled: e.target.checked })}
              className="rounded"
            />
            启用通知声音
          </label>
        </div>
      ) : showStats ? (
        <div className="space-y-3 mb-4">
          <div className="bg-editor-bg rounded-lg p-3">
            <h4 className="text-xs font-semibold text-editor-text mb-2">今日统计</h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold text-editor-accent">{todayStats?.completedSessions || 0}</p>
                <p className="text-[9px] text-editor-muted">完成番茄</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-editor-accent">{todayStats?.totalFocusMinutes || 0}</p>
                <p className="text-[9px] text-editor-muted">专注分钟</p>
              </div>
            </div>
          </div>
          <div className="bg-editor-bg rounded-lg p-3">
            <h4 className="text-xs font-semibold text-editor-text mb-2">本周统计</h4>
            <div className="space-y-1">
              {pomodoro.getWeeklyStats().map((stat: { date: string; completedSessions: number; totalFocusMinutes: number; totalBreakMinutes: number }) => (
                <div key={stat.date} className="flex justify-between text-[10px]">
                  <span className="text-editor-muted">{stat.date.slice(5)}</span>
                  <span className="text-editor-text">{stat.completedSessions}个番茄 / {stat.totalFocusMinutes}分钟</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

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
