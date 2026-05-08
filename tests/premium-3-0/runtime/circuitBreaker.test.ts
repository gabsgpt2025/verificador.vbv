import { afterEach, describe, expect, it, vi } from "vitest"
import {
  CircuitOpenError,
  getBreaker,
  resetBreakers,
} from "@/lib/premium-3-0/runtime/circuitBreaker"

describe("CircuitBreaker", () => {
  afterEach(() => {
    resetBreakers()
    vi.useRealTimers()
  })

  it("reuses breakers from the registry", () => {
    const first = getBreaker("neutrino:bin-lookup")
    const second = getBreaker("neutrino:bin-lookup")

    expect(second).toBe(first)
  })

  it("transitions from closed to open to half-open to closed", async () => {
    vi.useFakeTimers()
    const breaker = getBreaker("neutrino:bin-lookup", {
      failureThreshold: 2,
      successThreshold: 2,
      resetTimeoutMs: 1_000,
      timeoutMs: 100,
    })

    await expect(breaker.execute(() => Promise.reject(new Error("fail 1")))).rejects.toThrow("fail 1")
    expect(breaker.state).toBe("CLOSED")

    await expect(breaker.execute(() => Promise.reject(new Error("fail 2")))).rejects.toThrow("fail 2")
    expect(breaker.state).toBe("OPEN")

    await expect(breaker.execute(() => Promise.resolve("nope"))).rejects.toBeInstanceOf(CircuitOpenError)
    expect(breaker.metrics.rejected).toBe(1)

    vi.advanceTimersByTime(1_000)

    await expect(breaker.execute(() => Promise.resolve("ok"))).resolves.toBe("ok")
    expect(breaker.state).toBe("HALF_OPEN")

    await expect(breaker.execute(() => Promise.resolve("ok-again"))).resolves.toBe("ok-again")
    expect(breaker.state).toBe("CLOSED")
  })

  it("times out long-running operations", async () => {
    vi.useFakeTimers()
    const breaker = getBreaker("neutrino:timeout", {
      timeoutMs: 500,
      failureThreshold: 1,
    })

    const promise = breaker.execute(() => new Promise(() => undefined))
    await vi.advanceTimersByTimeAsync(500)

    await expect(promise).rejects.toMatchObject({ name: "TimeoutError" })
    expect(breaker.state).toBe("OPEN")
  })
})
