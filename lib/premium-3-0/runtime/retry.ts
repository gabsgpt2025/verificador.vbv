import { CircuitOpenError } from "./circuitBreaker"

export interface RetryOptions {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  retryOn?: (error: unknown) => boolean
  jitter?: boolean
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 2_000,
  retryOn: defaultRetryOn,
  jitter: true,
}

const RETRYABLE_ERROR_CODES = new Set(["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ENOTFOUND", "ECONNREFUSED"])

function getStatusFromError(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null
  }

  const status = Reflect.get(error, "status")
  if (typeof status === "number") {
    return status
  }

  const message = Reflect.get(error, "message")
  if (typeof message !== "string") {
    return null
  }

  const match = message.match(/\b([45]\d{2})\b/)
  return match ? Number(match[1]) : null
}

export function defaultRetryOn(error: unknown): boolean {
  if (error instanceof CircuitOpenError) {
    return false
  }

  const status = getStatusFromError(error)
  if (typeof status === "number") {
    return status >= 500
  }

  if (!(error instanceof Error)) {
    return false
  }

  const code = (error as NodeJS.ErrnoException).code
  if (code && RETRYABLE_ERROR_CODES.has(code)) {
    return true
  }

  const message = error.message.toLowerCase()
  return error.name === "AbortError" || error.name === "TimeoutError" || message.includes("timeout")
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function calculateDelayMs(retryIndex: number, options: RetryOptions): number {
  const jitterMs = options.jitter ? Math.floor(Math.random() * options.baseDelayMs) : 0
  return Math.min(options.baseDelayMs * 2 ** retryIndex + jitterMs, options.maxDelayMs)
}

export async function withRetry<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T> {
  const resolvedOptions: RetryOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    retryOn: options?.retryOn ?? DEFAULT_OPTIONS.retryOn,
  }

  let lastError: unknown

  for (let attempt = 1; attempt <= resolvedOptions.maxAttempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const shouldRetry = attempt < resolvedOptions.maxAttempts && resolvedOptions.retryOn?.(error)
      if (!shouldRetry) {
        throw error
      }

      await sleep(calculateDelayMs(attempt - 1, resolvedOptions))
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Retry attempts exhausted")
}
