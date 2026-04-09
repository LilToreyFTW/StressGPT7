import { createLogger } from './logger.js'

const logger = createLogger('async')

export class AsyncLock {
  private locks = new Map<string, Promise<unknown>>()

  async acquire<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // If there's already an operation in progress for this key, wait for it
    if (this.locks.has(key)) {
      logger.debug(`Waiting for lock: ${key}`)
      await this.locks.get(key)
    }

    // Create and store the new operation
    const promise = operation()
    this.locks.set(key, promise)

    try {
      const result = await promise
      return result
    } finally {
      // Clean up the lock
      this.locks.delete(key)
    }
  }

  isLocked(key: string): boolean {
    return this.locks.has(key)
  }

  clear(): void {
    this.locks.clear()
  }
}

export class AsyncQueue<T> {
  private queue: T[] = []
  private processing = false
  private concurrency: number
  private processor: (item: T) => Promise<void>

  constructor(concurrency: number = 1, processor: (item: T) => Promise<void>) {
    this.concurrency = concurrency
    this.processor = processor
  }

  async add(item: T): Promise<void> {
    this.queue.push(item)
    await this.process()
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    const workers = Array.from({ length: Math.min(this.concurrency, this.queue.length) }, async () => {
      while (this.queue.length > 0) {
        const item = this.queue.shift()
        if (item) {
          try {
            await this.processor(item)
          } catch (error) {
            logger.error('Queue item processing failed:', error)
          }
        }
      }
    })

    await Promise.all(workers)
    this.processing = false
  }

  size(): number {
    return this.queue.length
  }

  clear(): void {
    this.queue = []
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempt = 0

    const tryOperation = async (): Promise<void> => {
      try {
        const result = await operation()
        resolve(result)
      } catch (error) {
        attempt++
        
        if (attempt >= maxRetries) {
          logger.error(`Operation failed after ${maxRetries} retries:`, error)
          reject(error)
          return
        }

        const delayMs = baseDelay * Math.pow(backoffMultiplier, attempt - 1)
        logger.warn(`Operation failed, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries}):`, error)
        
        await delay(delayMs)
        await tryOperation()
      }
    }

    void tryOperation()
  })
}

export function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutError: Error = new Error(`Operation timed out after ${timeoutMs}ms`)
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(timeoutError), timeoutMs)
    )
  ])
}

export class AsyncCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>()
  private defaultTtl: number

  constructor(defaultTtl: number = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTtl = defaultTtl
  }

  async get(key: K): Promise<V | undefined> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return undefined
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  async set(key: K, value: V, ttl?: number): Promise<void> {
    const expiry = Date.now() + (ttl || this.defaultTtl)
    this.cache.set(key, { value, expiry })
  }

  async getOrSet(
    key: K, 
    factory: () => Promise<V>, 
    ttl?: number
  ): Promise<V> {
    const cached = await this.get(key)
    
    if (cached !== undefined) {
      return cached
    }

    const value = await factory()
    await this.set(key, value, ttl)
    return value
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

export function debounce<T extends any[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return (...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export function throttle<T extends any[]>(
  fn: (...args: T) => void,
  interval: number
): (...args: T) => void {
  let lastExecution = 0

  return (...args: T) => {
    const now = Date.now()
    
    if (now - lastExecution >= interval) {
      lastExecution = now
      fn(...args)
    }
  }
}
