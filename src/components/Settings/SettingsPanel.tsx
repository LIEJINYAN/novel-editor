import { useState, useEffect, useRef, useCallback } from 'react'
import { useThemeStore } from '../../store/themeStore'
import { useUIStore } from '../../store/uiStore'
import { useWordGoalStore } from '../../store/wordGoalStore'
import { useAutoSaveStore } from '../../store/autoSaveStore'
import { useCustomThemeStore, DEFAULT_COLORS, DARK_COLORS } from '../../store/customThemeStore'
import { useShortcutStore } from '../../store/shortcutStore'
import { getCloudConfig, saveCloudConfig, clearCloudConfig, testConnection, syncToCloud, getSyncStatus } from '../../services/cloudSync'
import Modal from '../common/Modal'
import type { ThemeColors } from '../../store/customThemeStore'
import type { CloudProvider } from '../../services/cloudSync'
import type { SaveStrategy } from '../../store/autoSaveStore'
import type { FocusToolbarMode } from '../../store/uiStore'

interface Props {
  onClose: () => void
}

type SettingsTab = 'appearance' | 'editor' | 'focus' | 'goals' | 'shortcuts' | 'cloud' | 'theme'

export default function SettingsPanel({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')

  const { theme, toggleTheme, wordWrap, toggleWordWrap } = useThemeStore()
  const { focusToolbarMode, setFocusToolbarMode, toggleFocusMode, toggleTypewriterMode } = useUIStore()
  const { goals, setDailyGoal, setChapterGoal, setNovelGoal } = useWordGoalStore()
  const { strategy, interval, autoSaveEnabled, setStrategy, setInterval: setAutoSaveInterval, toggleAutoSave } = useAutoSaveStore()
  const { customColors, setCustomColors, resetCustomColors } = useCustomThemeStore()

  const [cloudProvider, setCloudProvider] = useState<CloudProvider>('webdav')
  const [webdavServer, setWebdavServer] = useState('')
  const [webdavUsername, setWebdavUsername] = useState('')
  const [webdavPassword, setWebdavPassword] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string>('')
  const [lastSync, setLastSync] = useState<number | null>(null)

  useEffect(() => {
    const config = getCloudConfig()
    if (config) {
      setCloudProvider(config.provider)
      setWebdavServer(config.server || '')
      setWebdavUsername(config.username || '')
      setWebdavPassword(config.password || '')
      setGithubToken(config.token || '')
      setGithubRepo(config.repo || '')
    }
    const status = getSyncStatus()
    setLastSync(status.lastSync)
  }, [])

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'appearance', label: '外观', icon: '🎨' },
    { id: 'theme', label: '主题', icon: '🎭' },
    { id: 'editor', label: '编辑器', icon: '✏️' },
    { id: 'focus', label: '专注模式', icon: '🎯' },
    { id: 'goals', label: '字数目标', icon: '📊' },
    { id: 'shortcuts', label: '快捷键', icon: '⌨️' },
    { id: 'cloud', label: '云同步', icon: '☁️' },
  ]

  const { shortcuts, editingId, setEditing, updateShortcut, resetShortcut, resetAll } = useShortcutStore()
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const recordingRef = useRef(false)

  const handleStartRecord = useCallback((id: string) => {
    setRecordingId(id)
    recordingRef.current = true
    setEditing(id)
  }, [setEditing])

  const handleStopRecord = useCallback(() => {
    setRecordingId(null)
    recordingRef.current = false
    setEditing(null)
  }, [setEditing])

  useEffect(() => {
    if (!recordingId) return
    const handler = (e: KeyboardEvent) => {
      if (!recordingRef.current) return
      e.preventDefault()
      e.stopPropagation()

      let key = e.key
      if (key === ' ') key = 'Space'
      else if (key === 'Escape') { handleStopRecord(); return }
      else if (key.length === 1) key = key.toUpperCase()

      updateShortcut(recordingId, {
        key,
        ctrl: e.ctrlKey || e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey,
      })
      handleStopRecord()
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [recordingId, updateShortcut, handleStopRecord])

  const handleTestConnection = async () => {
    setIsTesting(true)
    setSyncStatus('')
    try {
      const config = {
        provider: cloudProvider,
        server: webdavServer,
        username: webdavUsername,
        password: webdavPassword,
        token: githubToken,
        repo: githubRepo,
      }
      const success = await testConnection(config)
      setSyncStatus(success ? '✅ 连接成功' : '❌ 连接失败')
    } catch (error: any) {
      setSyncStatus(`❌ ${error.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveCloudConfig = () => {
    saveCloudConfig({
      provider: cloudProvider,
      server: webdavServer,
      username: webdavUsername,
      password: webdavPassword,
      token: githubToken,
      repo: githubRepo,
    })
    setSyncStatus('✅ 配置已保存')
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncStatus('')
    try {
      await syncToCloud()
      const status = getSyncStatus()
      setLastSync(status.lastSync)
      setSyncStatus('✅ 同步成功')
    } catch (error: any) {
      setSyncStatus(`❌ ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const presetThemes = [
    { name: '默认浅色', colors: DEFAULT_COLORS },
    { name: '默认深色', colors: DARK_COLORS },
    { name: '护眼绿', colors: { ...DEFAULT_COLORS, background: '#f0fff0', sidebar: '#e8f5e9', accent: '#4caf50' } },
    { name: '暗夜蓝', colors: { ...DARK_COLORS, background: '#0d1117', sidebar: '#161b22', accent: '#58a6ff' } },
    { name: '暖阳橙', colors: { ...DEFAULT_COLORS, accent: '#ff9800' } },
    { name: '玫瑰粉', colors: { ...DEFAULT_COLORS, accent: '#e91e63' } },
  ]

  const colorLabels: Record<keyof ThemeColors, string> = {
    background: '背景色',
    surface: '表面色',
    sidebar: '侧边栏',
    border: '边框色',
    text: '文字色',
    muted: '辅助色',
    accent: '强调色',
    editorBg: '编辑器背景',
  }

  return (
    <Modal open={true} onClose={onClose} title="设置" size="lg">
      <div className="flex h-[70vh]">
        <div className="w-32 bg-editor-bg border-r border-editor-border flex flex-col overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-left text-xs transition-colors ${
                activeTab === tab.id
                  ? 'bg-editor-accent text-editor-bg'
                  : 'text-editor-muted hover:text-editor-text hover:bg-editor-surface'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
            <h2 className="text-sm font-semibold text-editor-text">⚙️ 设置</h2>
            <button onClick={onClose} className="text-editor-muted hover:text-editor-text">✕</button>
          </div>

          <div className="p-4">
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-editor-text">外观设置</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-editor-muted">主题模式</span>
                  <button onClick={toggleTheme} className={`px-3 py-1.5 text-xs rounded transition-colors ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-editor-border text-editor-text'}`}>
                    {theme === 'dark' ? '🌙 深色' : '☀️ 浅色'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-editor-text">自定义主题</h3>
                <div className="grid grid-cols-3 gap-2">
                  {presetThemes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setCustomColors(preset.colors)}
                      className="p-2 text-xs border border-editor-border rounded hover:border-editor-accent transition-colors"
                    >
                      <div className="flex gap-1 mb-1">
                        <div className="w-3 h-3 rounded" style={{ background: preset.colors.background }} />
                        <div className="w-3 h-3 rounded" style={{ background: preset.colors.surface }} />
                        <div className="w-3 h-3 rounded" style={{ background: preset.colors.accent }} />
                      </div>
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div className="border-t border-editor-border pt-4">
                  <h4 className="text-xs font-medium text-editor-muted mb-3">自定义颜色</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(colorLabels) as Array<keyof ThemeColors>).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors?.[key] || DEFAULT_COLORS[key]}
                          onChange={(e) => setCustomColors({ ...(customColors || DEFAULT_COLORS), [key]: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer"
                        />
                        <span className="text-xs text-editor-muted">{colorLabels[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={resetCustomColors} className="w-full py-2 text-xs text-red-500 hover:bg-red-500/10 rounded">
                  重置为默认
                </button>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-editor-text">编辑器设置</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-editor-muted">自动换行</span>
                  <button onClick={toggleWordWrap} className={`w-10 h-5 rounded-full transition-colors relative ${wordWrap ? 'bg-blue-500' : 'bg-editor-border'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${wordWrap ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="border-t border-editor-border pt-4">
                  <h4 className="text-xs font-medium text-editor-muted mb-2">自动保存</h4>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-editor-muted">启用自动保存</span>
                    <button onClick={toggleAutoSave} className={`w-10 h-5 rounded-full transition-colors relative ${autoSaveEnabled ? 'bg-blue-500' : 'bg-editor-border'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoSaveEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-editor-muted">保存策略</span>
                    <select value={strategy} onChange={(e) => setStrategy(e.target.value as SaveStrategy)} className="px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text">
                      <option value="auto">自动</option>
                      <option value="smart">智能</option>
                      <option value="manual">手动</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-editor-muted">保存间隔</span>
                    <select value={interval} onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))} className="px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text">
                      <option value={10000}>10秒</option>
                      <option value={30000}>30秒</option>
                      <option value={60000}>1分钟</option>
                      <option value={300000}>5分钟</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'focus' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-editor-text">专注模式设置</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-editor-muted">工具栏显示模式</span>
                    <select value={focusToolbarMode} onChange={(e) => setFocusToolbarMode(e.target.value as FocusToolbarMode)} className="px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text">
                    <option value="auto">悬停显示</option>
                    <option value="always">始终显示</option>
                    <option value="never">从不显示</option>
                  </select>
                </div>
                <div className="border-t border-editor-border pt-4">
                  <h4 className="text-xs font-medium text-editor-muted mb-2">快速操作</h4>
                  <div className="space-y-2">
                    <button onClick={toggleFocusMode} className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg rounded">🎯 切换专注模式 (Ctrl+Shift+F)</button>
                    <button onClick={toggleTypewriterMode} className="w-full text-left px-3 py-2 text-xs text-editor-text hover:bg-editor-bg rounded">⌨️ 切换打字机模式 (Ctrl+Shift+T)</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'goals' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-editor-text">字数目标设置</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-editor-muted">📅 每日目标</span>
                    <input type="number" value={goals.daily} onChange={(e) => setDailyGoal(parseInt(e.target.value, 10) || 0)} className="w-24 px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text text-right" />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-editor-muted">📖 章节目标</span>
                    <input type="number" value={goals.chapter} onChange={(e) => setChapterGoal(parseInt(e.target.value, 10) || 0)} className="w-24 px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text text-right" />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-editor-muted">📚 小说总目标</span>
                    <input type="number" value={goals.novel} onChange={(e) => setNovelGoal(parseInt(e.target.value, 10) || 0)} className="w-24 px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text text-right" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-editor-text">键盘快捷键</h3>
                  <div className="flex gap-2">
                    {recordingId && (
                      <span className="text-[10px] px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded animate-pulse">
                        按下新的快捷键... (ESC 取消)
                      </span>
                    )}
                    <button
                      onClick={resetAll}
                      className="text-[10px] px-2 py-1 text-editor-muted hover:text-editor-text hover:bg-editor-bg rounded"
                    >
                      恢复默认
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className={`flex items-center justify-between py-1.5 border-b border-editor-border last:border-0 ${
                        recordingId === shortcut.id ? 'bg-yellow-500/10 -mx-1 px-1 rounded' : ''
                      }`}
                    >
                      <span className="text-xs text-editor-muted">{shortcut.label}</span>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-0.5 text-[10px] bg-editor-bg border border-editor-border rounded text-editor-text font-mono min-w-[60px] text-center">
                          {shortcut.code}
                        </kbd>
                        <button
                          onClick={() => handleStartRecord(shortcut.id)}
                          className="text-[10px] px-1.5 py-0.5 text-editor-accent hover:bg-editor-bg rounded"
                          title="点击修改"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => resetShortcut(shortcut.id)}
                          className="text-[10px] px-1.5 py-0.5 text-editor-muted hover:text-editor-text hover:bg-editor-bg rounded"
                          title="恢复默认"
                        >
                          ↩
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cloud' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-editor-text">云同步设置</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-editor-muted">同步服务</span>
                  <select value={cloudProvider} onChange={(e) => setCloudProvider(e.target.value as CloudProvider)} className="px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text">
                    <option value="webdav">WebDAV</option>
                    <option value="github">GitHub</option>
                    <option value="gitee">Gitee</option>
                  </select>
                </div>
                {cloudProvider === 'webdav' && (
                  <>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-editor-muted">服务器地址</span>
                      <input type="url" value={webdavServer} onChange={(e) => setWebdavServer(e.target.value)} placeholder="https://dav.example.com" className="w-48 px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text" />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-editor-muted">用户名</span>
                      <input type="text" value={webdavUsername} onChange={(e) => setWebdavUsername(e.target.value)} className="w-48 px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text" />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-editor-muted">密码</span>
                      <input type="password" value={webdavPassword} onChange={(e) => setWebdavPassword(e.target.value)} className="w-48 px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text" />
                    </div>
                  </>
                )}
                {(cloudProvider === 'github' || cloudProvider === 'gitee') && (
                  <>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-editor-muted">Token</span>
                      <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="ghp_xxxx" className="w-48 px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text" />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-editor-muted">仓库</span>
                      <input type="text" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="user/repo" className="w-48 px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-editor-text" />
                    </div>
                  </>
                )}
                {syncStatus && <div className="text-xs text-center py-2">{syncStatus}</div>}
                {lastSync && <div className="text-xs text-editor-muted text-center">上次同步: {new Date(lastSync).toLocaleString()}</div>}
                <div className="flex gap-2">
                  <button onClick={handleTestConnection} disabled={isTesting} className="flex-1 py-2 text-xs bg-editor-bg border border-editor-border rounded hover:bg-editor-surface disabled:opacity-50">
                    {isTesting ? '测试中...' : '测试连接'}
                  </button>
                  <button onClick={handleSaveCloudConfig} className="flex-1 py-2 text-xs bg-editor-accent text-editor-bg rounded hover:opacity-90">
                    保存配置
                  </button>
                </div>
                <button onClick={handleSync} disabled={isSyncing} className="w-full py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                  {isSyncing ? '同步中...' : '立即同步'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
