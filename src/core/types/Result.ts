/**
 * Core result types for consistent error handling and return values
 * Implements functional programming patterns for better error handling
 */

/**
 * Represents a successful operation result
 */
export class Success<T, E = never> {
  constructor(public readonly value: T) {}

  isSuccess(): this is Success<T, E> {
    return true
  }

  isFailure(): this is Failure<T, E> {
    return false
  }

  map<U>(fn: (value: T) => U): Success<U, E> {
    return new Success(fn(this.value))
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value)
  }

  unwrap(): T {
    return this.value
  }

  unwrapOr(_defaultValue: T): T {
    return this.value
  }

  unwrapOrElse(_fn: (error: E) => T): T {
    return this.value
  }
}

/**
 * Represents a failed operation result
 */
export class Failure<T, E> {
  constructor(public readonly error: E) {}

  isSuccess(): this is Success<T, E> {
    return false
  }

  isFailure(): this is Failure<T, E> {
    return true
  }

  map<U>(_fn: (value: T) => U): Failure<U, E> {
    return new Failure(this.error)
  }

  flatMap<U>(_fn: (value: T) => Result<U, E>): Failure<U, E> {
    return new Failure(this.error)
  }

  unwrap(): never {
    throw new Error(`Cannot unwrap failure: ${this.error}`)
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return fn(this.error)
  }
}

/**
 * Result type - union of Success and Failure
 */
export type Result<T, E = Error> = Success<T, E> | Failure<T, E>

/**
 * Helper functions for creating Results
 */
export const Result = {
  success: <T, E>(value: T): Result<T, E> => new Success(value),
  failure: <T, E>(error: E): Result<T, E> => new Failure(error),
  fromPromise: async <T, E = Error>(
    promise: Promise<T>
  ): Promise<Result<T, E>> => {
    try {
      const value = await promise
      return Result.success(value)
    } catch (error) {
      return Result.failure(error as E)
    }
  },
  combine: <T, E>(results: Result<T, E>[]): Result<T[], E> => {
    const values: T[] = []
    for (const result of results) {
      if (result.isFailure()) {
        return new Failure(result.error)
      }
      values.push(result.value)
    }
    return Result.success(values)
  }
}

/**
 * Maybe type for nullable values
 */
export class Maybe<T> {
  private constructor(private readonly value: T | null | undefined) {}

  static some<T>(value: T): Maybe<T> {
    return new Maybe(value)
  }

  static none<T>(): Maybe<T> {
    return new Maybe<T>(null)
  }

  static fromNullable<T>(value: T | null | undefined): Maybe<T> {
    return new Maybe(value)
  }

  isSome(): this is { value: NonNullable<T> } {
    return this.value !== null && this.value !== undefined
  }

  isNone(): this is { value: null | undefined } {
    return this.value === null || this.value === undefined
  }

  map<U>(fn: (value: T) => U): Maybe<U> {
    return this.isSome() ? Maybe.some(fn(this.value!)) : Maybe.none()
  }

  flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    return this.isSome() ? fn(this.value!) : Maybe.none()
  }

  unwrapOr(defaultValue: T): T {
    return this.isSome() ? this.value! : defaultValue
  }

  unwrapOrElse(fn: () => T): T {
    return this.isSome() ? this.value! : fn()
  }

  filter(predicate: (value: T) => boolean): Maybe<T> {
    return this.isSome() && predicate(this.value!) ? this : Maybe.none()
  }

  toArray(): T[] {
    return this.isSome() ? [this.value!] : []
  }
}

/**
 * Option type for optional values (alias for Maybe)
 */
export type Option<T> = Maybe<T>

/**
 * Helper functions for Maybe/Option
 */
export const Option = {
  some: Maybe.some,
  none: Maybe.none,
  fromNullable: Maybe.fromNullable,
  fromUndefined: <T>(value: T | undefined): Option<T> => 
    value !== undefined ? Maybe.some(value) : Maybe.none(),
  fromNull: <T>(value: T | null): Option<T> => 
    value !== null ? Maybe.some(value) : Maybe.none()
}
