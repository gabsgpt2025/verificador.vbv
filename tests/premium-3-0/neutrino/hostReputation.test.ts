import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchHostReputationDetailed } from "@/lib/premium-3-0/neutrino"
import { getBreaker, resetBreakers } from "@/lib/premium-3-0/runtime/circuitBreaker"
import { resetCacheState } from "@/lib/premium-3-0/runtime/cache"

describe("neutrino host-reputation", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    process.env.NEUTRINO_API_KEY = ""
    process.env.NEUTRINO_USER_ID = ""
    resetCacheState()
    resetBreakers()
  })

  it("happy path", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ is_listed: true, reputation_score: 75 }), { status: 200 })))

    const result = await fetchHostReputationDetailed({ host: "checkout.example.com" })
    expect(result.data.is_listed).toBe(true)
  })

  it("throws on 4xx", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad request", { status: 400 })))

    await expect(fetchHostReputationDetailed({ host: "checkout.example.com" })).rejects.toThrow("400")
  })

  it("retries on 5xx", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ is_listed: false, reputation_score: 10 }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchHostReputationDetailed({ host: "checkout.example.com" })
    expect(result.data.reputation_score).toBe(10)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("returns cache hit", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ is_listed: false }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    await fetchHostReputationDetailed({ host: "checkout.example.com" })
    const second = await fetchHostReputationDetailed({ host: "checkout.example.com" })

    expect(second.meta.cached).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("fails fast when breaker is open", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    getBreaker("neutrino:host-reputation", { failureThreshold: 1, timeoutMs: 100, resetTimeoutMs: 999999 })
    const fetchMock = vi.fn().mockResolvedValue(new Response("boom", { status: 503 }))
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchHostReputationDetailed({ host: "checkout.example.com" })).rejects.toThrow("timed out")
    await expect(fetchHostReputationDetailed({ host: "checkout.example.com" })).rejects.toThrow("open")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
