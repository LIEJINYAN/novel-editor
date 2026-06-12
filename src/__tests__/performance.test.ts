import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  reportMetric,
  reportError,
  getMetrics,
  getErrors,
  getMetricSummary,
  getPerformanceScore,
  clearMetrics,
  clearErrors,
} from '../utils/performance'

describe('performance', () => {
  beforeEach(() => {
    clearMetrics()
    clearErrors()
  })

  it('should report a metric', () => {
    reportMetric('LCP', 2000)
    const metrics = getMetrics()
    expect(metrics.length).toBe(1)
    expect(metrics[0].name).toBe('LCP')
    expect(metrics[0].value).toBe(2000)
    expect(metrics[0].rating).toBe('good')
  })

  it('should rate LCP correctly', () => {
    reportMetric('LCP', 1500)
    expect(getMetrics()[0].rating).toBe('good')

    reportMetric('LCP', 3000)
    expect(getMetrics()[1].rating).toBe('needs-improvement')

    reportMetric('LCP', 5000)
    expect(getMetrics()[2].rating).toBe('poor')
  })

  it('should rate FCP correctly', () => {
    reportMetric('FCP', 1500)
    expect(getMetrics()[0].rating).toBe('good')

    reportMetric('FCP', 2500)
    expect(getMetrics()[1].rating).toBe('needs-improvement')

    reportMetric('FCP', 4000)
    expect(getMetrics()[2].rating).toBe('poor')
  })

  it('should rate CLS correctly', () => {
    reportMetric('CLS', 0.05)
    expect(getMetrics()[0].rating).toBe('good')

    reportMetric('CLS', 0.15)
    expect(getMetrics()[1].rating).toBe('needs-improvement')

    reportMetric('CLS', 0.3)
    expect(getMetrics()[2].rating).toBe('poor')
  })

  it('should report an error', () => {
    const error = new Error('test error')
    reportError(error)
    const errors = getErrors()
    expect(errors.length).toBe(1)
    expect(errors[0].message).toBe('test error')
    expect(errors[0].type).toBe('component')
  })

  it('should report error with stack', () => {
    const error = new Error('test error')
    error.stack = 'Error: test error\n    at test.js:1:1'
    reportError(error, '<Component />')
    const errors = getErrors()
    expect(errors[0].stack).toBeTruthy()
    expect(errors[0].componentStack).toBe('<Component />')
  })

  it('should calculate metric summary', () => {
    clearMetrics()
    reportMetric('LCP', 1500)
    reportMetric('LCP', 3000)
    reportMetric('LCP', 5000)
    const summary = getMetricSummary()
    expect(summary['LCP'].count).toBe(3)
    expect(summary['LCP'].good).toBe(1)
    expect(summary['LCP'].poor).toBe(1)
  })

  it('should calculate performance score', () => {
    reportMetric('LCP', 1500)
    reportMetric('FCP', 1500)
    reportMetric('CLS', 0.05)
    const score = getPerformanceScore()
    expect(score).toBe(100)
  })

  it('should give lower score for poor metrics', () => {
    reportMetric('LCP', 5000)
    reportMetric('FCP', 5000)
    reportMetric('CLS', 0.5)
    const score = getPerformanceScore()
    expect(score).toBeLessThan(50)
  })

  it('should clear metrics', () => {
    reportMetric('LCP', 1500)
    expect(getMetrics().length).toBe(1)
    clearMetrics()
    expect(getMetrics().length).toBe(0)
  })

  it('should clear errors', () => {
    reportError(new Error('test'))
    expect(getErrors().length).toBe(1)
    clearErrors()
    expect(getErrors().length).toBe(0)
  })
})
