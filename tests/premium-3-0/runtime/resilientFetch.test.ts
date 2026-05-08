import { afterEach, describe, expect, it, vi } from "vitest"
import { getCacheStats, resetCacheState } from "@/lib/premium-3-0/runtime/cache"
import { CircuitOpenError, resetBreakers } from "@/lib/premium-3-0/runtime/circuitBreaker"
import { getMetricsFor, resetMetrics } from "@/lib/premium-3-0/runtime/metrics"
import { resilientFetch } from "@/lib/premium-3-0/runtime/resilientFetch"

describe("resilientFetch", () => {
  afterEach(() => {
    resetCacheState()
    resetBreakers()
    resetMetrics()
  })

  it("fetches, parses, caches and serves cache hits", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ card_brand: "VISA" })
    const parse = vi.fn((raw: unknown) => ({ ...(raw as { card_brand: string }), normalized: true }))

    const first = await resilientFetch(fetchFn, {
      providerName: "neutrino",
      operation: "bin-lookup",
      cacheKey: "neutrino:bin-lookup:411111",
      cacheTtlSeconds: 60,
      parse,
    })

    const second = await resilientFetch(fetchFn, {
      providerName: "neutrino",
      operation: "bin-lookup",
      cacheKey: "neutrino:bin-lookup:411111",
      cacheTtlSeconds: 60,
      parse,
    })

    expect(first.cached).toBe(false)
    expect(first.data).toEqual({ card_brand: "VISA", normalized: true })
    expect(second.cached).toBe(true)
    expect(second.latencyMs).toBe(0)
    expect(fetchFn).toHaveBeenCalledTimes(1)

    expect(getCacheStats()).toMatchObject({ hits: 1, misses: 1 })
    expect(getMetricsFor("neutrino", "bin-lookup")).toMatchObject({
      totalCalls: 2,
      successCount: 2,
      cacheHits: 1,
      cacheMisses: 1,
    })
  })

  it("does not cache parse failures", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ invalid: true })
    const parse = vi.fn(() => {
      throw new Error("schema invalid")
    })

    await expect(
      resilientFetch(fetchFn, {
        providerName: "neutrino",
        operation: "bin-lookup",
        cacheKey: "neutrino:bin-lookup:555555",
        cacheTtlSeconds: 60,
        parse,
      }),
    ).rejects.toThrow("schema invalid")

    await expect(
      resilientFetch(fetchFn, {
        providerName: "neutrino",
        operation: "bin-lookup",
        cacheKey: "neutrino:bin-lookup:555555",
        cacheTtlSeconds: 60,
        parse,
      }),
    ).rejects.toThrow("schema invalid")

    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it("surfaces circuit open errors after repeated failures", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("Neutrino API error: 503 - unavailable"))

    await expect(
      resilientFetch(fetchFn, {
        providerName: "neutrino",
        operation: "bin-lookup",
        cacheKey: "neutrino:bin-lookup:400000",
        cacheTtlSeconds: 0,
        breakerOptions: {
          name: "neutrino:bin-lookup-test",
          failureThreshold: 1,
          timeoutMs: 100,
        },
        retryOptions: {
          maxAttempts: 1,
          jitter: false,
        },
        parse: (raw) => raw as { ok: true },
      }),
    ).rejects.toThrow("503")

    await expect(
      resilientFetch(fetchFn, {
        providerName: "neutrino",
        operation: "bin-lookup",
        cacheKey: "neutrino:bin-lookup:400000",
        cacheTtlSeconds: 0,
        breakerOptions: {
          name: "neutrino:bin-lookup-test",
          failureThreshold: 1,
          timeoutMs: 100,
        },
        retryOptions: {
          maxAttempts: 1,
          jitter: false,
        },
        parse: (raw) => raw as { ok: true },
      }),
    ).rejects.toBeInstanceOf(CircuitOpenError)

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(getMetricsFor("neutrino", "bin-lookup")?.circuitOpens).toBe(1)
  })
})
