interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  delta?: number
}

interface ErrorReport {
  id: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  url: string
  userAgent: string
  type: 'error' | 'unhandledrejection' | 'component'
}

const STORAGE_KEY = 'novel-engine-performance'
const MAX_METRICS = 100
const MAX_ERRORS = 50

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
    INP: [200, 500],
  }

  const [good, poor] = thresholds[name] || [0, 0]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

function loadMetrics(): PerformanceMetric[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return data.metrics || []
    }
  } catch {}
  return []
}

function loadErrors(): ErrorReport[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return data.errors || []
    }
  } catch {}
  return []
}

function saveData(metrics: PerformanceMetric[], errors: ErrorReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      metrics: metrics.slice(-MAX_METRICS),
      errors: errors.slice(-MAX_ERRORS),
    }))
  } catch {}
}

let metrics: PerformanceMetric[] = loadMetrics()
let errors: ErrorReport[] = loadErrors()

export function reportMetric(name: string, value: number, delta?: number): void {
  const metric: PerformanceMetric = {
    name,
    value,
    rating: getRating(name, value),
    timestamp: Date.now(),
    delta,
  }

  metrics.push(metric)
  saveData(metrics, errors)
}

export function reportError(error: Error, componentStack?: string): void {
  const errorReport: ErrorReport = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    message: error.message,
    stack: error.stack,
    componentStack,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    type: 'component',
  }

  errors.push(errorReport)
  saveData(metrics, errors)
}

export function getMetrics(): PerformanceMetric[] {
  return [...metrics]
}

export function getErrors(): ErrorReport[] {
  return [...errors]
}

export function getMetricSummary(): Record<string, { count: number; avg: number; good: number; poor: number }> {
  const summary: Record<string, { count: number; avg: number; good: number; poor: number }> = {}

  for (const metric of metrics) {
    if (!summary[metric.name]) {
      summary[metric.name] = { count: 0, avg: 0, good: 0, poor: 0 }
    }
    const s = summary[metric.name]
    s.count++
    s.avg = (s.avg * (s.count - 1) + metric.value) / s.count
    if (metric.rating === 'good') s.good++
    if (metric.rating === 'poor') s.poor++
  }

  return summary
}

export function clearMetrics(): void {
  metrics = []
  saveData(metrics, errors)
}

export function clearErrors(): void {
  errors = []
  saveData(metrics, errors)
}

export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return

  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        if (lastEntry) {
          reportMetric('LCP', lastEntry.startTime, lastEntry.startTime)
        }
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {}

    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        reportMetric('CLS', clsValue)
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
    } catch {}

    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        if (lastEntry) {
          reportMetric('FCP', lastEntry.startTime)
        }
      })
      fcpObserver.observe({ type: 'paint', buffered: true })
    } catch {}
  }

  window.addEventListener('error', (event) => {
    const error = new Error(event.message)
    error.stack = `${event.filename}:${event.lineno}:${event.colno}`
    reportError(error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))
    reportError(error)
  })
}

export function getPerformanceScore(): number {
  const summary = getMetricSummary()
  const metricNames = ['LCP', 'FCP', 'CLS']
  let totalScore = 0
  let count = 0

  for (const name of metricNames) {
    if (summary[name]) {
      const s = summary[name]
      const goodRatio = s.count > 0 ? s.good / s.count : 1
      totalScore += goodRatio * 100
      count++
    }
  }

  return count > 0 ? Math.round(totalScore / count) : 100
}
