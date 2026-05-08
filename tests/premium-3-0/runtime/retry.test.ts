import { afterEach, describe, expect, it, vi } from "vitest"
import { CircuitOpenError } from "@/lib/premium-3-0/runtime/circuitBreaker"
import { withRetry } from "@/lib/premium-3-0/runtime/retry"

describe("withRetry", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("retries with exponential backoff", async () => {
    vi.useFakeTimers()
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("Neutrino API error: 502 - temporary"))
      .mockRejectedValueOnce(new Error("Neutrino API error: 503 - temporary"))
      .mockResolvedValue("ok")

    const promise = withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      jitter: false,
    })

    await Promise.resolve()
    expect(fn).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(100)
    expect(fn).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(200)
    await expect(promise).resolves.toBe("ok")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("adds jitter to retry delays when enabled", async () => {
    vi.useFakeTimers()

    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue("ok")

    const promise = withRetry(fn, {
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      jitter: true,
    })

    await Promise.resolve()
    expect(fn).toHaveBeenCalledTimes(1)

    const expectedDelayMs = 133 // baseDelayMs(100) + deterministic jitter floor(100 * (1 / 3))

    await vi.advanceTimersByTimeAsync(expectedDelayMs - 1)
    expect(fn).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toBe("ok")
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("does not retry 4xx errors", async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("Neutrino API error: 400 - invalid request"))

    await expect(withRetry(fn, { maxAttempts: 3, jitter: false })).rejects.toThrow("400")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("does not retry when the circuit is already open", async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new CircuitOpenError("neutrino:bin-lookup"))

    await expect(withRetry(fn, { maxAttempts: 3, jitter: false })).rejects.toBeInstanceOf(CircuitOpenError)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
