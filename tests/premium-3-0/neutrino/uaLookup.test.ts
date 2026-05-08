import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchUaLookupDetailed } from "@/lib/premium-3-0/neutrino"
import { getBreaker, resetBreakers } from "@/lib/premium-3-0/runtime/circuitBreaker"
import { resetCacheState } from "@/lib/premium-3-0/runtime/cache"

describe("neutrino ua-lookup", () => {
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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ browser: "Chrome", is_bot: false }), { status: 200 })))

    const result = await fetchUaLookupDetailed({ ua: "Mozilla/5.0" })
    expect(result.data.browser).toBe("Chrome")
  })

  it("throws on 4xx", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad request", { status: 401 })))

    await expect(fetchUaLookupDetailed({ ua: "Mozilla/5.0" })).rejects.toThrow("401")
  })

  it("retries on 5xx", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ browser: "Firefox" }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchUaLookupDetailed({ ua: "Mozilla/5.0" })
    expect(result.data.browser).toBe("Firefox")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("returns cache hit", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ browser: "Safari" }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    await fetchUaLookupDetailed({ ua: "Mozilla/5.0 (Macintosh)" })
    const second = await fetchUaLookupDetailed({ ua: "Mozilla/5.0 (Macintosh)" })

    expect(second.meta.cached).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("fails fast when breaker is open", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    getBreaker("neutrino:ua-lookup", { failureThreshold: 1, timeoutMs: 100, resetTimeoutMs: 999999 })
    const fetchMock = vi.fn().mockResolvedValue(new Response("boom", { status: 503 }))
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchUaLookupDetailed({ ua: "Mozilla/5.0" })).rejects.toThrow("timed out")
    await expect(fetchUaLookupDetailed({ ua: "Mozilla/5.0" })).rejects.toThrow("open")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
