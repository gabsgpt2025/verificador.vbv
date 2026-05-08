import { describe, expect, it } from "vitest"
import { getMetrics, getMetricsFor, recordCall, resetMetrics } from "@/lib/premium-3-0/runtime/metrics"

describe("runtime metrics", () => {
  it("tracks provider metrics with a bounded latency buffer", () => {
    resetMetrics()

    for (let latency = 1; latency <= 1_005; latency += 1) {
      recordCall("neutrino", "bin-lookup", {
        success: latency % 5 !== 0,
        cached: latency % 2 === 0,
        latencyMs: latency,
        error: latency % 5 === 0 ? new Error(`failure ${latency}`) : undefined,
      })
    }

    const metrics = getMetricsFor("neutrino", "bin-lookup")
    expect(metrics).not.toBeNull()
    expect(metrics?.totalCalls).toBe(1_005)
    expect(metrics?.latency.samples).toBe(1_000)
    expect(metrics?.latency.p50).toBe(505)
    expect(metrics?.latency.p95).toBe(955)
    expect(metrics?.latency.p99).toBe(995)
    expect(metrics?.lastError?.message).toBe("failure 1005")
    expect(getMetrics()).toHaveLength(1)

    resetMetrics()
    expect(getMetrics()).toEqual([])
  })
})
