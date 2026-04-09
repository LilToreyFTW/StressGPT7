/**
 * Dependency Injection Container for StressGPT7
 * Provides a clean abstraction for managing dependencies and service lifetime
 */

import { Result } from '../types/Result.js'
import type { IEventEmitter } from '../events/IEventEmitter.js'

/**
 * Service lifetime options
 */
export enum ServiceLifetime {
  /** New instance created each time it's requested */
  Transient = 'transient',
  /** Single instance shared across the application */
  Singleton = 'singleton',
  /** Single instance per scope */
  Scoped = 'scoped'
}

/**
 * Service registration options
 */
export interface ServiceRegistrationOptions {
  /** Service lifetime */
  readonly lifetime: ServiceLifetime
  /** Service dependencies */
  readonly dependencies?: string[]
  /** Service factory function */
  readonly factory?: () => unknown
  /** Service instance (for singleton) */
  readonly instance?: unknown
  /** Whether to auto-wire dependencies */
  readonly autoWire?: boolean
}

/**
 * Service registration
 */
export interface ServiceRegistration {
  /** Service identifier */
  readonly id: string
  /** Service constructor or factory */
  readonly implementation: unknown
  /** Service registration options */
  readonly options: ServiceRegistrationOptions
  /** Service creation timestamp */
  readonly createdAt: Date
}

/**
 * Service resolution context
 */
export interface ResolutionContext {
  /** Resolution depth */
  readonly depth: number
  /** Currently resolving services */
  readonly resolving: Set<string>
  /** Resolution scope */
  readonly scope?: string
}

/**
 * Container statistics
 */
export interface ContainerStats {
  /** Total registered services */
  totalServices: number
  /** Number of singleton services */
  singletonServices: number
  /** Number of transient services */
  transientServices: number
  /** Number of scoped services */
  scopedServices: number
  /** Total resolutions performed */
  totalResolutions: number
  /** Average resolution time */
  averageResolutionTime: number
  /** Number of circular dependencies detected */
  circularDependencies: number
}

/**
 * Core dependency injection container interface
 */
export interface IDIContainer {
  /**
   * Register a service
   */
  register<TService>(
    id: string,
    implementation: new (...args: any[]) => TService,
    options?: Partial<ServiceRegistrationOptions>
  ): Result<void>

  /**
   * Register a service with factory
   */
  registerFactory<TService>(
    id: string,
    factory: (container: IDIContainer) => TService,
    options?: Partial<ServiceRegistrationOptions>
  ): Result<void>

  /**
   * Register a singleton instance
   */
  registerInstance<TService>(
    id: string,
    instance: TService,
    options?: Partial<ServiceRegistrationOptions>
  ): Result<void>

  /**
   * Resolve a service
   */
  resolve<TService>(id: string): Result<TService>

  /**
   * Resolve a service with scope
   */
  resolveWithScope<TService>(id: string, scope: string): Result<TService>

  /**
   * Check if a service is registered
   */
  isRegistered(id: string): boolean

  /**
   * Get service registration
   */
  getRegistration(id: string): Result<ServiceRegistration>

  /**
   * Get all registered services
   */
  getAllRegistrations(): ReadonlyMap<string, ServiceRegistration>

  /**
   * Unregister a service
   */
  unregister(id: string): Result<void>

  /**
   * Clear all services
   */
  clear(): Result<void>

  /**
   * Create a child scope
   */
  createScope(scopeId: string): IDIContainer

  /**
   * Get container statistics
   */
  getStats(): Result<ContainerStats>

  /**
   * Dispose of the container
   */
  dispose(): Promise<void>
}

/**
 * Abstract base DI container providing common functionality
 */
export abstract class BaseDIContainer implements IDIContainer {
  protected services = new Map<string, ServiceRegistration>()
  protected singletons = new Map<string, unknown>()
  protected scoped = new Map<string, Map<string, unknown>>()
  protected stats: ContainerStats = {
    totalServices: 0,
    singletonServices: 0,
    transientServices: 0,
    scopedServices: 0,
    totalResolutions: 0,
    averageResolutionTime: 0,
    circularDependencies: 0
  }
  protected eventEmitter?: IEventEmitter

  constructor(eventEmitter?: IEventEmitter) {
    this.eventEmitter = eventEmitter
  }

  /**
   * Register a service
   */
  register<TService>(
    id: string,
    implementation: new (...args: any[]) => TService,
    options: Partial<ServiceRegistrationOptions> = {}
  ): Result<void> {
    try {
      if (this.services.has(id)) {
        return Result.failure(new Error(`Service '${id}' is already registered`))
      }

      const registration: ServiceRegistration = {
        id,
        implementation,
        options: {
          lifetime: ServiceLifetime.Transient,
          autoWire: true,
          ...options
        },
        createdAt: new Date()
      }

      this.services.set(id, registration)
      this.updateStats()

      this.emitEvent('service:registered', { id, registration })

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Register a service with factory
   */
  registerFactory<TService>(
    id: string,
    factory: (container: IDIContainer) => TService,
    options: Partial<ServiceRegistrationOptions> = {}
  ): Result<void> {
    try {
      if (this.services.has(id)) {
        return Result.failure(new Error(`Service '${id}' is already registered`))
      }

      const registration: ServiceRegistration = {
        id,
        implementation: factory,
        options: {
          lifetime: ServiceLifetime.Transient,
          autoWire: true,
          ...options
        },
        createdAt: new Date()
      }

      this.services.set(id, registration)
      this.updateStats()

      this.emitEvent('service:registered', { id, registration })

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Register a singleton instance
   */
  registerInstance<TService>(
    id: string,
    instance: TService,
    options: Partial<ServiceRegistrationOptions> = {}
  ): Result<void> {
    try {
      if (this.services.has(id)) {
        return Result.failure(new Error(`Service '${id}' is already registered`))
      }

      const registration: ServiceRegistration = {
        id,
        implementation: instance,
        options: {
          lifetime: ServiceLifetime.Singleton,
          autoWire: false,
          instance,
          ...options
        },
        createdAt: new Date()
      }

      this.services.set(id, registration)
      this.singletons.set(id, instance)
      this.updateStats()

      this.emitEvent('service:registered', { id, registration })

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Resolve a service
   */
  resolve<TService>(id: string): Result<TService> {
    return this.resolveWithScope<TService>(id, 'default')
  }

  /**
   * Resolve a service with scope
   */
  resolveWithScope<TService>(id: string, scope: string): Result<TService> {
    const startTime = Date.now()
    
    try {
      this.stats.totalResolutions++

      const context: ResolutionContext = {
        depth: 0,
        resolving: new Set(),
        scope
      }

      const result = this.resolveInternal<TService>(id, context)
      
      // Update stats
      const duration = Date.now() - startTime
      this.updateResolutionStats(duration)

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.updateResolutionStats(duration)
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Internal resolution method
   */
  protected resolveInternal<TService>(
    id: string,
    context: ResolutionContext
  ): Result<TService> {
    // Check for circular dependencies
    if (context.resolving.has(id)) {
      this.stats.circularDependencies++
      return Result.failure(new Error(`Circular dependency detected: ${Array.from(context.resolving).join(' -> ')} -> ${id}`))
    }

    // Check if service is registered
    const registration = this.services.get(id)
    if (!registration) {
      return Result.failure(new Error(`Service '${id}' is not registered`))
    }

    // Check for existing instances based on lifetime
    switch (registration.options.lifetime) {
      case ServiceLifetime.Singleton:
        if (this.singletons.has(id)) {
          return Result.success(this.singletons.get(id) as TService)
        }
        break
      case ServiceLifetime.Scoped:
        if (context.scope && this.scoped.has(context.scope)) {
          const scopedInstances = this.scoped.get(context.scope)!
          if (scopedInstances.has(id)) {
            return Result.success(scopedInstances.get(id) as TService)
          }
        }
        break
      case ServiceLifetime.Transient:
        // Always create new instance
        break
    }

    // Add to resolving set
    context.resolving.add(id)

    try {
      // Create instance
      const instance = this.createInstance<TService>(registration, context)

      // Store instance based on lifetime
      switch (registration.options.lifetime) {
        case ServiceLifetime.Singleton:
          this.singletons.set(id, instance)
          break
        case ServiceLifetime.Scoped:
          if (context.scope) {
            if (!this.scoped.has(context.scope)) {
              this.scoped.set(context.scope, new Map())
            }
            this.scoped.get(context.scope)!.set(id, instance)
          }
          break
        case ServiceLifetime.Transient:
          // Don't store transient instances
          break
      }

      // Remove from resolving set
      context.resolving.delete(id)

      this.emitEvent('service:resolved', { id, instance })

      return Result.success(instance)
    } catch (error) {
      context.resolving.delete(id)
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Create a service instance
   */
  protected createInstance<TService>(
    registration: ServiceRegistration,
    context: ResolutionContext
  ): TService {
    // Check for pre-configured instance
    if (registration.options.instance) {
      return registration.options.instance as TService
    }

    // Check for factory function
    if (typeof registration.implementation === 'function' && registration.options.factory) {
      const factory = registration.implementation as (container: IDIContainer) => TService
      return factory(this)
    }

    // Check for constructor
    if (typeof registration.implementation === 'function') {
      const constructor = registration.implementation as new (...args: any[]) => TService
      
      // Resolve dependencies
      const dependencies = this.resolveDependencies(registration, context)
      
      // Create instance
      return new constructor(...dependencies)
    }

    throw new Error(`Unable to create instance for service '${registration.id}'`)
  }

  /**
   * Resolve service dependencies
   */
  protected resolveDependencies(
    registration: ServiceRegistration,
    context: ResolutionContext
  ): unknown[] {
    if (!registration.options.autoWire || !registration.options.dependencies) {
      return []
    }

    const dependencies: unknown[] = []
    
    for (const dependencyId of registration.options.dependencies) {
      const dependencyResult = this.resolveInternal(dependencyId, context)
      if (dependencyResult.isFailure()) {
        throw new Error(`Failed to resolve dependency '${dependencyId}' for service '${registration.id}': ${dependencyResult.error.message}`)
      }
      dependencies.push(dependencyResult.value)
    }

    return dependencies
  }

  /**
   * Check if a service is registered
   */
  isRegistered(id: string): boolean {
    return this.services.has(id)
  }

  /**
   * Get service registration
   */
  getRegistration(id: string): Result<ServiceRegistration> {
    const registration = this.services.get(id)
    if (!registration) {
      return Result.failure(new Error(`Service '${id}' is not registered`))
    }
    return Result.success(registration)
  }

  /**
   * Get all registered services
   */
  getAllRegistrations(): ReadonlyMap<string, ServiceRegistration> {
    return new Map(this.services)
  }

  /**
   * Unregister a service
   */
  unregister(id: string): Result<void> {
    try {
      const deleted = this.services.delete(id)
      if (!deleted) {
        return Result.failure(new Error(`Service '${id}' is not registered`))
      }

      // Clean up instances
      this.singletons.delete(id)
      for (const scopedInstances of this.scoped.values()) {
        scopedInstances.delete(id)
      }

      this.updateStats()
      this.emitEvent('service:unregistered', { id })

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Clear all services
   */
  clear(): Result<void> {
    try {
      this.services.clear()
      this.singletons.clear()
      this.scoped.clear()
      this.updateStats()
      
      this.emitEvent('container:cleared', {})

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Create a child scope
   */
  createScope(scopeId: string): IDIContainer {
    return new ScopedDIContainer(this, scopeId, this.eventEmitter)
  }

  /**
   * Get container statistics
   */
  getStats(): Result<ContainerStats> {
    return Result.success({ ...this.stats })
  }

  /**
   * Dispose of the container
   */
  async dispose(): Promise<void> {
    this.clear()
    
    // Dispose all singleton instances that have dispose method
    for (const instance of this.singletons.values()) {
      if (instance && typeof instance === 'object' && 'dispose' in instance && typeof instance.dispose === 'function') {
        try {
          await (instance as { dispose(): Promise<void> }).dispose()
        } catch (error) {
          console.error('Error disposing instance:', error)
        }
      }
    }

    this.singletons.clear()
    this.scoped.clear()
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.totalServices = this.services.size
    
    let singletonCount = 0
    let transientCount = 0
    let scopedCount = 0

    for (const registration of this.services.values()) {
      switch (registration.options.lifetime) {
        case ServiceLifetime.Singleton:
          singletonCount++
          break
        case ServiceLifetime.Transient:
          transientCount++
          break
        case ServiceLifetime.Scoped:
          scopedCount++
          break
      }
    }

    this.stats.singletonServices = singletonCount
    this.stats.transientServices = transientCount
    this.stats.scopedServices = scopedCount
  }

  /**
   * Update resolution statistics
   */
  private updateResolutionStats(duration: number): void {
    const totalResolutions = this.stats.totalResolutions
    this.stats.averageResolutionTime = 
      (this.stats.averageResolutionTime * (totalResolutions - 1) + duration) / totalResolutions
  }

  /**
   * Emit an event if event emitter is available
   */
  private emitEvent(eventType: string, data: unknown): void {
    if (this.eventEmitter) {
      void this.eventEmitter.emit(eventType, data, 'DIContainer')
    }
  }
}

/**
 * Scoped DI container for managing scoped services
 */
class ScopedDIContainer extends BaseDIContainer {
  private parentContainer: BaseDIContainer
  private scopeId: string

  constructor(parentContainer: BaseDIContainer, scopeId: string, eventEmitter?: IEventEmitter) {
    super(eventEmitter)
    this.parentContainer = parentContainer
    this.scopeId = scopeId
  }

  /**
   * Resolve a service (delegates to parent for non-scoped services)
   */
  resolveWithScope<TService>(id: string, scope: string): Result<TService> {
    if (scope !== this.scopeId) {
      return this.parentContainer.resolveWithScope<TService>(id, scope)
    }

    return super.resolveWithScope<TService>(id, scope)
  }

  /**
   * Check if a service is registered (checks parent too)
   */
  isRegistered(id: string): boolean {
    return super.isRegistered(id) || this.parentContainer.isRegistered(id)
  }

  /**
   * Get service registration (checks parent too)
   */
  getRegistration(id: string): Result<ServiceRegistration> {
    const localRegistration = super.getRegistration(id)
    if (localRegistration.isSuccess()) {
      return localRegistration
    }
    return this.parentContainer.getRegistration(id)
  }

  /**
   * Get all registered services (includes parent services)
   */
  getAllRegistrations(): ReadonlyMap<string, ServiceRegistration> {
    const allServices = new Map(this.parentContainer.getAllRegistrations())
    for (const [id, registration] of super.getAllRegistrations()) {
      allServices.set(id, registration)
    }
    return allServices
  }
}
