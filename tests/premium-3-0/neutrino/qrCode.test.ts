import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchQrCodeDetailed } from "@/lib/premium-3-0/neutrino"
import { resetBreakers } from "@/lib/premium-3-0/runtime/circuitBreaker"
import { resetCacheState } from "@/lib/premium-3-0/runtime/cache"

describe("neutrino qr-code", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    process.env.NEUTRINO_API_KEY = ""
    process.env.NEUTRINO_USER_ID = ""
    resetCacheState()
    resetBreakers()
  })

  it("returns binary payload", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array([137, 80, 78, 71]), { status: 200 })))

    const result = await fetchQrCodeDetailed({ content: "hello" })

    expect(result.data).toBeInstanceOf(ArrayBuffer)
    expect(new Uint8Array(result.data)).toEqual(new Uint8Array([137, 80, 78, 71]))
  })

  it("returns cache hit for repeated request", async () => {
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "uid"
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    await fetchQrCodeDetailed({ content: "same-content" })
    const second = await fetchQrCodeDetailed({ content: "same-content" })

    expect(second.meta.cached).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

