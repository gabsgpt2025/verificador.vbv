import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchIpInfoDetailed } from "@/lib/premium-3-0/neutrino"
import { getBreaker, resetBreakers } from "@/lib/premium-3-0/runtime/circuitBreaker"
import { resetCacheState } from "@/lib/premium-3-0/runtime/cache"

describe("neutrino ip-info", () => {
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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ country_code: "BR", city: "Sao Paulo" }), { status: 200 })))

    const result = await fetchIpInfoDetailed({ ip: "1.1.1.1" })
    expect(result.data.country_code).toBe("BR")
    expect(result.meta.cached).toBe(false)
  })

  it("throws on 4xx", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad request", { status: 400 })))

    await expect(fetchIpInfoDetailed({ ip: "1.1.1.1" })).rejects.toThrow("400")
  })

  it("retries on 5xx", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ country_code: "US" }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchIpInfoDetailed({ ip: "8.8.8.8" })
    expect(result.data.country_code).toBe("US")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("returns cache hit", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ country_code: "CA" }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    await fetchIpInfoDetailed({ ip: "9.9.9.9" })
    const second = await fetchIpInfoDetailed({ ip: "9.9.9.9" })

    expect(second.meta.cached).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("fails fast when breaker is open", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    getBreaker("neutrino:ip-info", { failureThreshold: 1, timeoutMs: 100, resetTimeoutMs: 999999 })
    const fetchMock = vi.fn().mockResolvedValue(new Response("boom", { status: 503 }))
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchIpInfoDetailed({ ip: "2.2.2.2" })).rejects.toThrow("timed out")
    await expect(fetchIpInfoDetailed({ ip: "2.2.2.2" })).rejects.toThrow("open")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
