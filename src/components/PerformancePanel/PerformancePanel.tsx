import { useState, useEffect } from 'react'
import {
  getMetrics,
  getErrors,
  getMetricSummary,
  getPerformanceScore,
  clearMetrics,
  clearErrors,
  type PerformanceMetric,
  type ErrorReport,
} from '../../utils/performance'
import Modal from '../common/Modal'

interface Props {
  onClose: () => void
}

export default function PerformancePanel({ onClose }: Props) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [errors, setErrors] = useState<ErrorReport[]>([])
  const [activeTab, setActiveTab] = useState<'metrics' | 'errors'>('metrics')

  useEffect(() => {
    setMetrics(getMetrics())
    setErrors(getErrors())
  }, [])

  const summary = getMetricSummary()
  const score = getPerformanceScore()

  const handleClear = () => {
    if (activeTab === 'metrics') {
      clearMetrics()
      setMetrics([])
    } else {
      clearErrors()
      setErrors([])
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-500'
      case 'needs-improvement': return 'text-yellow-500'
      case 'poor': return 'text-red-500'
      default: return 'text-editor-muted'
    }
  }

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'good': return '良好'
      case 'needs-improvement': return '待改进'
      case 'poor': return '较差'
      default: return rating
    }
  }

  return (
    <Modal open={true} onClose={onClose} title="📊 性能监控" size="lg">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4 p-3 bg-editor-bg rounded-lg">
          <div className="text-center">
            <p className="text-3xl font-bold text-editor-accent">{score}</p>
            <p className="text-[10px] text-editor-muted">性能评分</p>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            {Object.entries(summary).map(([name, data]) => (
              <div key={name} className="p-2 bg-editor-surface rounded">
                <p className="text-xs font-semibold text-editor-text">{name}</p>
                <p className="text-[10px] text-editor-muted">
                  均值: {Math.round(data.avg)}ms
                </p>
                <p className={`text-[10px] ${getRatingColor(data.good > data.poor ? 'good' : 'poor')}`}>
                  良好: {data.good}/{data.count}
                </p>
              </div>
            ))}
            {Object.keys(summary).length === 0 && (
              <p className="col-span-3 text-xs text-editor-muted">暂无性能数据</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 text-xs rounded ${
              activeTab === 'metrics'
                ? 'bg-editor-accent text-editor-bg'
                : 'bg-editor-surface text-editor-muted hover:text-editor-text'
            }`}
          >
            性能指标 ({metrics.length})
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-1.5 text-xs rounded ${
              activeTab === 'errors'
                ? 'bg-editor-accent text-editor-bg'
                : 'bg-editor-surface text-editor-muted hover:text-editor-text'
            }`}
          >
            错误日志 ({errors.length})
          </button>
          <button
            onClick={handleClear}
            className="ml-auto px-3 py-1.5 text-xs text-red-500 hover:text-red-400"
          >
            清空
          </button>
        </div>

        <div className="max-h-[40vh] overflow-y-auto">
          {activeTab === 'metrics' ? (
            metrics.length === 0 ? (
              <p className="text-center text-editor-muted text-xs py-8">暂无性能指标数据</p>
            ) : (
              <div className="space-y-2">
                {metrics.slice().reverse().map((metric, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-editor-bg rounded text-xs">
                    <span className="font-mono text-editor-text">{metric.name}</span>
                    <span className="text-editor-muted">{Math.round(metric.value)}ms</span>
                    <span className={getRatingColor(metric.rating)}>
                      {getRatingLabel(metric.rating)}
                    </span>
                    <span className="text-editor-muted">{formatTime(metric.timestamp)}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            errors.length === 0 ? (
              <p className="text-center text-editor-muted text-xs py-8">暂无错误日志</p>
            ) : (
              <div className="space-y-2">
                {errors.slice().reverse().map((error) => (
                  <div key={error.id} className="p-2 bg-editor-bg rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-red-500 font-mono truncate flex-1">{error.message}</span>
                      <span className="text-editor-muted ml-2">{formatTime(error.timestamp)}</span>
                    </div>
                    {error.stack && (
                      <p className="text-[10px] text-editor-muted font-mono break-all line-clamp-2">
                        {error.stack}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </Modal>
  )
}
