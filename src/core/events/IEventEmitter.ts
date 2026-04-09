/**
 * Event system interface for StressGPT7
 * Provides a clean abstraction for event-driven architecture
 */

import { Result } from '../types/Result.js'

/**
 * Base event interface
 */
export interface IEvent {
  /** Unique event identifier */
  readonly id: string
  /** Event type/name */
  readonly type: string
  /** Event timestamp */
  readonly timestamp: Date
  /** Event source */
  readonly source: string
  /** Event data payload */
  readonly data: unknown
  /** Event metadata */
  readonly metadata?: {
    readonly priority?: number
    readonly retryCount?: number
    readonly maxRetries?: number
    readonly timeout?: number
  }
}

/**
 * Event listener interface
 */
export interface IEventListener<TEventData = unknown> {
  /** Listener identifier */
  readonly id: string
  /** Event type this listener handles */
  readonly eventType: string
  /** Listener priority */
  readonly priority: number
  /** Whether the listener is persistent */
  readonly persistent: boolean
  /** Event handler function */
  handler(event: IEvent & { readonly data: TEventData }): Promise<Result<void, Error>>
}

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  /** Listener priority */
  readonly priority?: number
  /** Whether the listener should persist after one event */
  readonly persistent?: boolean
  /** Maximum number of times this listener can be called */
  readonly maxCalls?: number
  /** Event filter function */
  readonly filter?: (event: IEvent) => boolean
  /** Event transformer function */
  readonly transformer?: (event: IEvent) => IEvent
}

/**
 * Event emitter statistics
 */
export interface EventEmitterStats {
  /** Total events emitted */
  totalEventsEmitted: number
  /** Total events processed */
  totalEventsProcessed: number
  /** Number of active listeners */
  activeListeners: number
  /** Average processing time */
  averageProcessingTime: number
  /** Number of failed events */
  failedEvents: number
  /** Last event timestamp */
  lastEventTimestamp?: Date
}

/**
 * Core event emitter interface
 */
export interface IEventEmitter {
  /**
   * Emit an event
   */
  emit<TEventData = unknown>(
    eventType: string,
    data: TEventData,
    source?: string,
    metadata?: IEvent['metadata']
  ): Promise<Result<void, Error>>

  /**
   * Subscribe to events
   */
  on<TEventData = unknown>(
    eventType: string,
    handler: (event: IEvent & { readonly data: TEventData }) => Promise<Result<void, Error>>,
    options?: EventSubscriptionOptions
  ): Promise<Result<string, Error>>

  /**
   * Subscribe to events (once)
   */
  once<TEventData = unknown>(
    eventType: string,
    handler: (event: IEvent & { readonly data: TEventData }) => Promise<Result<void, Error>>,
    options?: EventSubscriptionOptions
  ): Promise<Result<string, Error>>

  /**
   * Unsubscribe from events
   */
  off(listenerId: string): Promise<Result<void, Error>>

  /**
   * Unsubscribe all listeners for an event type
   */
  offAll(eventType: string): Promise<Result<void, Error>>

  /**
   * Get active listeners for an event type
   */
  getListeners(eventType: string): Promise<Result<readonly IEventListener[], Error>>

  /**
   * Get all active listeners
   */
  getAllListeners(): Promise<Result<readonly IEventListener[], Error>>

  /**
   * Check if there are listeners for an event type
   */
  hasListeners(eventType: string): Promise<boolean>

  /**
   * Get event emitter statistics
   */
  getStats(): Promise<Result<EventEmitterStats, Error>>

  /**
   * Clear all listeners
   */
  clear(): Promise<Result<void, Error>>

  /**
   * Dispose of the event emitter
   */
  dispose(): Promise<void>
}

/**
 * Abstract base event emitter providing common functionality
 */
export abstract class BaseEventEmitter implements IEventEmitter {
  protected listeners = new Map<string, IEventListener[]>()
  protected stats: EventEmitterStats = {
    totalEventsEmitted: 0,
    totalEventsProcessed: 0,
    activeListeners: 0,
    averageProcessingTime: 0,
    failedEvents: 0
  }

  /**
   * Emit an event
   */
  async emit<TEventData = unknown>(
    eventType: string,
    data: TEventData,
    source = 'unknown',
    metadata?: IEvent['metadata']
  ): Promise<Result<void, Error>> {
    const startTime = Date.now()
    
    try {
      // Update stats
      this.stats.totalEventsEmitted++

      // Create event
      const event: IEvent & { readonly data: TEventData } = {
        id: this.generateEventId(),
        type: eventType,
        timestamp: new Date(),
        source,
        data,
        metadata
      }

      // Get listeners for this event type
      const listenersResult = await this.getListeners(eventType)
      if (listenersResult.isFailure()) {
        return Result.failure(listenersResult.error)
      }

      const listeners = listenersResult.value
      if (listeners.length === 0) {
        return Result.success(void 0)
      }

      // Sort listeners by priority (higher priority first)
      const sortedListeners = [...listeners].sort((a, b) => b.priority - a.priority)

      // Process listeners in parallel
      const promises = sortedListeners.map(async listener => {
        try {
          // Apply filter if present
          if (listener.handler.length > 0 && 'filter' in listener && (listener as any).filter) {
            const filter = (listener as any).filter as (event: IEvent) => boolean
            if (!filter(event)) {
              return Result.success(void 0)
            }
          }

          // Apply transformer if present
          let processedEvent = event
          if ('transformer' in listener && (listener as any).transformer) {
            const transformer = (listener as any).transformer as (event: IEvent) => IEvent
            processedEvent = transformer(event) as typeof event
          }

          // Execute handler
          const result = await listener.handler(processedEvent)
          
          // Remove non-persistent listeners
          if (!listener.persistent) {
            await this.off(listener.id)
          }

          // Ensure the result type matches
          if (result.isFailure()) {
            return Result.failure(result.error)
          }
          return Result.success(void 0)
        } catch (error) {
          return Result.failure(error instanceof Error ? error : new Error(String(error)))
        }
      })

      // Wait for all listeners to complete
      const results = await Promise.all(promises)
      
      // Check for failures
      const failures = results.filter(r => r.isFailure())
      if (failures.length > 0) {
        this.stats.failedEvents++
        return Result.failure(failures[0].error as Error)
      }

      // Update stats
      const duration = Date.now() - startTime
      this.updateProcessingStats(duration)
      this.stats.lastEventTimestamp = new Date()

      return Result.success(void 0)
    } catch (error) {
      const duration = Date.now() - startTime
      this.updateProcessingStats(duration)
      this.stats.failedEvents++
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Subscribe to events
   */
  async on<TEventData = unknown>(
    eventType: string,
    handler: (event: IEvent & { readonly data: TEventData }) => Promise<Result<void, Error>>,
    options: EventSubscriptionOptions = {}
  ): Promise<Result<string, Error>> {
    try {
      const listener: IEventListener<TEventData> = {
        id: this.generateListenerId(),
        eventType,
        priority: options.priority || 0,
        persistent: options.persistent !== false,
        handler
      }

      // Add listener to the map
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, [])
      }
      this.listeners.get(eventType)!.push(listener as IEventListener)

      // Update stats
      this.updateListenerStats()

      return Result.success(listener.id)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Subscribe to events (once)
   */
  async once<TEventData = unknown>(
    eventType: string,
    handler: (event: IEvent & { readonly data: TEventData }) => Promise<Result<void, Error>>,
    options: EventSubscriptionOptions = {}
  ): Promise<Result<string, Error>> {
    return this.on(eventType, handler, { ...options, persistent: false })
  }

  /**
   * Unsubscribe from events
   */
  async off(listenerId: string): Promise<Result<void, Error>> {
    try {
      let removed = false

      // Search all event types for this listener
      for (const [eventType, listeners] of this.listeners.entries()) {
        const index = listeners.findIndex(l => l.id === listenerId)
        if (index !== -1) {
          listeners.splice(index, 1)
          removed = true
          
          // Remove empty event type arrays
          if (listeners.length === 0) {
            this.listeners.delete(eventType)
          }
          break
        }
      }

      if (!removed) {
        return Result.failure(new Error(`Listener '${listenerId}' not found`))
      }

      // Update stats
      this.updateListenerStats()

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Unsubscribe all listeners for an event type
   */
  async offAll(eventType: string): Promise<Result<void, Error>> {
    try {
      const deleted = this.listeners.delete(eventType)
      
      if (!deleted) {
        return Result.failure(new Error(`No listeners found for event type '${eventType}'`))
      }

      // Update stats
      this.updateListenerStats()

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get active listeners for an event type
   */
  async getListeners(eventType: string): Promise<Result<readonly IEventListener[], Error>> {
    const listeners = this.listeners.get(eventType) || []
    return Result.success([...listeners])
  }

  /**
   * Get all active listeners
   */
  async getAllListeners(): Promise<Result<readonly IEventListener[], Error>> {
    const allListeners: IEventListener[] = []
    
    for (const listeners of this.listeners.values()) {
      allListeners.push(...listeners)
    }

    return Result.success(allListeners)
  }

  /**
   * Check if there are listeners for an event type
   */
  async hasListeners(eventType: string): Promise<boolean> {
    const listeners = this.listeners.get(eventType)
    return listeners !== undefined && listeners.length > 0
  }

  /**
   * Get event emitter statistics
   */
  async getStats(): Promise<Result<EventEmitterStats, Error>> {
    return Result.success({ ...this.stats })
  }

  /**
   * Clear all listeners
   */
  async clear(): Promise<Result<void, Error>> {
    try {
      this.listeners.clear()
      this.updateListenerStats()
      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Dispose of the event emitter
   */
  async dispose(): Promise<void> {
    await this.clear()
  }

  /**
   * Generate a unique event ID
   */
  protected generateEventId(): string {
    return crypto.randomUUID()
  }

  /**
   * Generate a unique listener ID
   */
  protected generateListenerId(): string {
    return crypto.randomUUID()
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(duration: number): void {
    this.stats.totalEventsProcessed++
    
    // Update average processing time
    const totalProcessed = this.stats.totalEventsProcessed
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (totalProcessed - 1) + duration) / totalProcessed
  }

  /**
   * Update listener statistics
   */
  private updateListenerStats(): void {
    let totalListeners = 0
    for (const listeners of this.listeners.values()) {
      totalListeners += listeners.length
    }
    this.stats.activeListeners = totalListeners
  }
}
