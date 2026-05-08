import type { CircuitBreakerOptions } from "./circuitBreaker"
import { getBreaker } from "./circuitBreaker"
import { getCache } from "./cache"
import { recordCall } from "./metrics"
import type { RetryOptions } from "./retry"
import { withRetry } from "./retry"

export interface ResilientFetchOptions<T> {
  providerName: string
  operation: string
  cacheKey: string
  cacheTtlSeconds: number
  breakerOptions?: Partial<CircuitBreakerOptions>
  retryOptions?: Partial<RetryOptions>
  parse: (raw: unknown) => T
}

export async function resilientFetch<T>(
  fetchFn: () => Promise<unknown>,
  options: ResilientFetchOptions<T>,
): Promise<{ data: T; cached: boolean; latencyMs: number }> {
  const cache = getCache()
  const startedAt = Date.now()

  if (options.cacheTtlSeconds > 0) {
    try {
      const cachedValue = await cache.get<T>(options.cacheKey)
      if (cachedValue !== null) {
        recordCall(options.providerName, options.operation, {
          success: true,
          cached: true,
          latencyMs: 0,
        })

        return {
          data: cachedValue,
          cached: true,
          latencyMs: 0,
        }
      }
    } catch {
      // Cache errors must not fail the upstream lookup.
    }
  }

  const breakerName = options.breakerOptions?.name ?? `${options.providerName}:${options.operation}`
  const breaker = getBreaker(breakerName, {
    name: breakerName,
    ...options.breakerOptions,
  })

  try {
    const raw = await breaker.execute(() => withRetry(fetchFn, options.retryOptions))
    const parsed = options.parse(raw)
    const latencyMs = Date.now() - startedAt

    if (options.cacheTtlSeconds > 0) {
      try {
        await cache.set(options.cacheKey, parsed, options.cacheTtlSeconds)
      } catch {
        // Cache errors must not fail the upstream lookup.
      }
    }

    recordCall(options.providerName, options.operation, {
      success: true,
      cached: false,
      latencyMs,
    })

    return {
      data: parsed,
      cached: false,
      latencyMs,
    }
  } catch (error) {
    const latencyMs = Date.now() - startedAt
    recordCall(options.providerName, options.operation, {
      success: false,
      cached: false,
      latencyMs,
      error: error instanceof Error ? error : new Error(String(error)),
    })
    throw error
  }
}
