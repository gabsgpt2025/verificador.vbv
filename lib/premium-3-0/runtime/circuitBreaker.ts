import { EventEmitter } from "events"

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN"

export interface CircuitBreakerOptions {
  name: string
  failureThreshold: number
  successThreshold: number
  timeoutMs: number
  resetTimeoutMs: number
}

const DEFAULT_OPTIONS = {
  failureThreshold: 5,
  successThreshold: 2,
  timeoutMs: 5_000,
  resetTimeoutMs: 30_000,
} satisfies Omit<CircuitBreakerOptions, "name">

export class CircuitOpenError extends Error {
  constructor(public readonly circuitName: string) {
    super(`Circuit ${circuitName} is open`)
    this.name = "CircuitOpenError"
  }
}

function createTimeoutError(timeoutMs: number): Error {
  const error = new Error(`Operation timed out after ${timeoutMs}ms`)
  error.name = "TimeoutError"
  return error
}

function createTimeoutPromise(timeoutMs: number): Promise<never> {
  const signal = AbortSignal.timeout(timeoutMs)

  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(createTimeoutError(timeoutMs))
      return
    }

    signal.addEventListener(
      "abort",
      () => {
        reject(createTimeoutError(timeoutMs))
      },
      { once: true },
    )
  })
}

export class CircuitBreaker extends EventEmitter {
  public state: CircuitState = "CLOSED"
  public readonly metrics = {
    successes: 0,
    failures: 0,
    rejected: 0,
  }

  private consecutiveFailures = 0
  private consecutiveHalfOpenSuccesses = 0
  private openedAt = 0
  public readonly options: CircuitBreakerOptions

  constructor(options: CircuitBreakerOptions) {
    super()
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.maybeTransitionToHalfOpen()

    if (this.state === "OPEN") {
      this.metrics.rejected += 1
      throw new CircuitOpenError(this.options.name)
    }

    try {
      const result = await Promise.race([fn(), createTimeoutPromise(this.options.timeoutMs)])
      this.onSuccess()
      this.emit("success", { name: this.options.name, state: this.state })
      return result
    } catch (error) {
      this.onFailure()
      this.emit("failure", { name: this.options.name, state: this.state, error })
      throw error
    }
  }

  private onSuccess() {
    this.metrics.successes += 1
    this.consecutiveFailures = 0

    if (this.state === "HALF_OPEN") {
      this.consecutiveHalfOpenSuccesses += 1
      if (this.consecutiveHalfOpenSuccesses >= this.options.successThreshold) {
        this.transitionTo("CLOSED")
      }
      return
    }

    this.consecutiveHalfOpenSuccesses = 0
  }

  private onFailure() {
    this.metrics.failures += 1
    this.consecutiveHalfOpenSuccesses = 0

    if (this.state === "HALF_OPEN") {
      this.transitionTo("OPEN")
      return
    }

    this.consecutiveFailures += 1
    if (this.consecutiveFailures >= this.options.failureThreshold) {
      this.transitionTo("OPEN")
    }
  }

  private maybeTransitionToHalfOpen() {
    if (this.state !== "OPEN") {
      return
    }

    const elapsedMs = Date.now() - this.openedAt
    if (elapsedMs >= this.options.resetTimeoutMs) {
      this.transitionTo("HALF_OPEN")
    }
  }

  private transitionTo(nextState: CircuitState) {
    if (this.state === nextState) {
      return
    }

    const previousState = this.state
    this.state = nextState

    if (nextState === "OPEN") {
      this.openedAt = Date.now()
    }

    if (nextState === "CLOSED") {
      this.consecutiveFailures = 0
      this.consecutiveHalfOpenSuccesses = 0
      this.openedAt = 0
    }

    if (nextState === "HALF_OPEN") {
      this.consecutiveHalfOpenSuccesses = 0
    }

    this.emit("state-change", {
      name: this.options.name,
      previousState,
      state: nextState,
    })
  }
}

const breakerRegistry = new Map<string, CircuitBreaker>()

export function getBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  const existing = breakerRegistry.get(name)
  if (existing) {
    return existing
  }

  const breaker = new CircuitBreaker({
    name,
    ...DEFAULT_OPTIONS,
    ...options,
  })
  breakerRegistry.set(name, breaker)
  return breaker
}

export function listBreakers(): CircuitBreaker[] {
  return Array.from(breakerRegistry.values())
}

export function resetBreakers() {
  breakerRegistry.clear()
}
