import { createLogger } from './logger.js'

const logger = createLogger('performance')

export interface PerformanceMetrics {
  operationName: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, unknown>
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private activeOperations = new Map<string, PerformanceMetrics>()

  startOperation(name: string, metadata?: Record<string, unknown>): string {
    const operationId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const metric: PerformanceMetrics = {
      operationName: name,
      startTime: performance.now(),
      metadata
    }

    this.activeOperations.set(operationId, metric)
    logger.debug(`Started operation: ${name}`, { operationId, metadata })
    
    return operationId
  }

  endOperation(operationId: string, additionalMetadata?: Record<string, unknown>): PerformanceMetrics | null {
    const metric = this.activeOperations.get(operationId)
    if (!metric) {
      logger.warn(`Operation not found: ${operationId}`)
      return null
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata }
    }

    this.metrics.push(metric)
    this.activeOperations.delete(operationId)

    logger.debug(`Completed operation: ${metric.operationName}`, {
      duration: metric.duration,
      operationId
    })

    return metric
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAverageDuration(operationName: string): number {
    const operationMetrics = this.metrics.filter(m => m.operationName === operationName)
    if (operationMetrics.length === 0) return 0

    const totalDuration = operationMetrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    return totalDuration / operationMetrics.length
  }

  getStats(): Record<string, { count: number; avgDuration: number; minDuration: number; maxDuration: number }> {
    const stats: Record<string, { count: number; avgDuration: number; minDuration: number; maxDuration: number }> = {}

    for (const metric of this.metrics) {
      if (!metric.duration) continue

      if (!stats[metric.operationName]) {
        stats[metric.operationName] = {
          count: 0,
          avgDuration: 0,
          minDuration: metric.duration,
          maxDuration: metric.duration
        }
      }

      const stat = stats[metric.operationName]
      stat.count++
      stat.avgDuration = ((stat.avgDuration * (stat.count - 1)) + metric.duration) / stat.count
      stat.minDuration = Math.min(stat.minDuration, metric.duration)
      stat.maxDuration = Math.max(stat.maxDuration, metric.duration)
    }

    return stats
  }

  clear(): void {
    this.metrics = []
    this.activeOperations.clear()
    logger.debug('Performance metrics cleared')
  }
}

export function withPerformanceMonitoring<T extends any[], R>(
  monitor: PerformanceMonitor,
  operationName: string,
  fn: (...args: T) => R,
  metadata?: Record<string, unknown>
): (...args: T) => R {
  return (...args: T): R => {
    const operationId = monitor.startOperation(operationName, metadata)
    
    try {
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result.finally(() => {
          monitor.endOperation(operationId)
        }) as R
      } else {
        monitor.endOperation(operationId)
        return result
      }
    } catch (error) {
      monitor.endOperation(operationId, { error: String(error) })
      throw error
    }
  }
}

export const globalPerformanceMonitor = new PerformanceMonitor()

export function measurePerformance<T extends any[], R>(
  operationName: string,
  fn: (...args: T) => R,
  metadata?: Record<string, unknown>
): (...args: T) => R {
  return withPerformanceMonitoring(globalPerformanceMonitor, operationName, fn, metadata)
}
