import { useState, useEffect, useCallback } from 'react'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
}

interface ReminderSettings {
  enabled: boolean
  intervalMinutes: number
  message: string
}

const STORAGE_KEY = 'novel-engine-reminder'

function loadSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { enabled: false, intervalMinutes: 60, message: '该写作了！' }
  } catch { return { enabled: false, intervalMinutes: 60, message: '该写作了！' } }
}

function saveSettings(settings: ReminderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export default function WritingReminder({ onClose }: Props) {
  const [settings, setSettings] = useState<ReminderSettings>(loadSettings)
  const [lastReminder, setLastReminder] = useState<number | null>(null)

  useEffect(() => { saveSettings(settings) }, [settings])

  useEffect(() => {
    if (!settings.enabled) return
    const timer = setInterval(() => {
      if (Notification.permission === 'granted') {
        new Notification('写作提醒', { body: settings.message, icon: '📖' })
      }
      setLastReminder(Date.now())
    }, settings.intervalMinutes * 60 * 1000)
    return () => clearInterval(timer)
  }, [settings])

  const requestPermission = useCallback(async () => {
    if (Notification.permission === 'default') await Notification.requestPermission()
  }, [])

  useEffect(() => { requestPermission() }, [requestPermission])

  return (
    <Modal open={true} onClose={onClose} title="🔔 写作提醒" size="sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-editor-muted">启用提醒</span>
          <button
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`w-10 h-5 rounded-full transition-colors relative ${settings.enabled ? 'bg-blue-500' : 'bg-editor-border'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-editor-muted">提醒间隔</span>
          <select
            value={settings.intervalMinutes}
            onChange={(e) => setSettings({ ...settings, intervalMinutes: parseInt(e.target.value) })}
            className="px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text"
          >
            <option value={15}>15分钟</option>
            <option value={30}>30分钟</option>
            <option value={60}>1小时</option>
            <option value={120}>2小时</option>
            <option value={180}>3小时</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-editor-muted">提醒消息</span>
          <input
            type="text"
            value={settings.message}
            onChange={(e) => setSettings({ ...settings, message: e.target.value })}
            className="w-48 px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text"
          />
        </div>

        <div className="text-[10px] text-editor-muted">
          {Notification.permission === 'granted' ? '✅ 通知权限已授予'
            : Notification.permission === 'denied' ? '❌ 通知权限被拒绝'
            : '⚠️ 需要通知权限'}
        </div>

        {lastReminder && (
          <div className="text-[10px] text-editor-muted text-center">
            上次提醒: {new Date(lastReminder).toLocaleTimeString('zh-CN')}
          </div>
        )}
      </div>
    </Modal>
  )
}
