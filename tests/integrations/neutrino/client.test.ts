import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("Neutrino integration client", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it("retorna null quando endpoint está desabilitado", async () => {
    delete process.env.NEUTRINO_BAD_WORD_FILTER_ENABLED
    process.env.NEUTRINO_API_KEY = "key"
    process.env.NEUTRINO_USER_ID = "user"
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const { callNeutrinoBadWordFilter } = await import("@/lib/integrations/neutrino/client")
    const result = await callNeutrinoBadWordFilter({ content: "foo" })

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("retorna null quando endpoint está habilitado mas credenciais não existem", async () => {
    process.env.NEUTRINO_BAD_WORD_FILTER_ENABLED = "true"
    delete process.env.NEUTRINO_API_KEY
    delete process.env.NEUTRINO_USER_ID
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const { callNeutrinoBadWordFilter } = await import("@/lib/integrations/neutrino/client")
    const result = await callNeutrinoBadWordFilter({ content: "foo" })

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("chama o endpoint Neutrino quando habilitado e configurado", async () => {
    process.env.NEUTRINO_IP_INFO_ENABLED = "true"
    process.env.NEUTRINO_API_KEY = "key-123"
    process.env.NEUTRINO_USER_ID = "user-456"
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ip: "8.8.8.8", country: "US" }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { callNeutrinoIpInfo } = await import("@/lib/integrations/neutrino/client")
    const result = await callNeutrinoIpInfo({ ip: "8.8.8.8" })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://neutrinoapi.net/ip-info")
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({
      "User-ID": "user-456",
      "API-Key": "key-123",
      "Content-Type": "application/x-www-form-urlencoded",
    })
    expect(init.body).toBe("ip=8.8.8.8")
    expect(result).toEqual({ ip: "8.8.8.8", country: "US" })
  })
})
