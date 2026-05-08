import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchIpProbeDetailed } from "@/lib/premium-3-0/neutrino"
import { getBreaker, resetBreakers } from "@/lib/premium-3-0/runtime/circuitBreaker"
import { resetCacheState } from "@/lib/premium-3-0/runtime/cache"

describe("neutrino ip-probe", () => {
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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ is_proxy: true, is_vpn: false }), { status: 200 })))

    const result = await fetchIpProbeDetailed({ ip: "1.1.1.1" })
    expect(result.data.is_proxy).toBe(true)
  })

  it("throws on 4xx", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad request", { status: 404 })))

    await expect(fetchIpProbeDetailed({ ip: "1.1.1.1" })).rejects.toThrow("404")
  })

  it("retries on 5xx", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ is_proxy: false }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchIpProbeDetailed({ ip: "8.8.8.8" })
    expect(result.data.is_proxy).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("returns cache hit", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ is_proxy: false }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    await fetchIpProbeDetailed({ ip: "9.9.9.9" })
    const second = await fetchIpProbeDetailed({ ip: "9.9.9.9" })

    expect(second.meta.cached).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("fails fast when breaker is open", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    getBreaker("neutrino:ip-probe", { failureThreshold: 1, timeoutMs: 100, resetTimeoutMs: 999999 })
    const fetchMock = vi.fn().mockResolvedValue(new Response("boom", { status: 503 }))
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchIpProbeDetailed({ ip: "2.2.2.2" })).rejects.toThrow("timed out")
    await expect(fetchIpProbeDetailed({ ip: "2.2.2.2" })).rejects.toThrow("open")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
