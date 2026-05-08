import { afterEach, describe, expect, it, vi } from "vitest"
import { resetCacheState } from "../lib/premium-3-0/runtime/cache"
import { resetBreakers } from "../lib/premium-3-0/runtime/circuitBreaker"
import { resetMetrics } from "../lib/premium-3-0/runtime/metrics"
import { callNeutrinoApi } from "../lib/premium-3-0/neutrino-api"

describe("Neutrino API integration", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.NEUTRINO_API_KEY
    delete process.env.NEUTRINO_USER_ID
    resetCacheState()
    resetBreakers()
    resetMetrics()
  })

  it("posts to the official endpoint with bin-number", async () => {
    process.env.NEUTRINO_API_KEY = "test-api-key"
    process.env.NEUTRINO_USER_ID = "test-user-id"

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ valid: true, card_brand: "VISA" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    vi.stubGlobal("fetch", fetchMock)

    await callNeutrinoApi("4057 0812 3456")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://neutrinoapi.net/bin-lookup")
    expect(options.method).toBe("POST")
    expect(options.headers).toMatchObject({
      "User-ID": "test-user-id",
      "API-Key": "test-api-key",
      "Content-Type": "application/x-www-form-urlencoded",
    })
    expect(options.body).toBe("bin-number=40570812")
  })

  it("includes the response body in thrown API errors", async () => {
    process.env.NEUTRINO_API_KEY = "test-api-key"
    process.env.NEUTRINO_USER_ID = "test-user-id"
    vi.spyOn(console, "error").mockImplementation(() => {})

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Missing parameter: bin-number", {
          status: 400,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    )

    await expect(callNeutrinoApi("405708")).rejects.toThrow(
      "Neutrino API error: 400 - Missing parameter: bin-number",
    )
  })

  it("retries transient API errors with backoff", async () => {
    process.env.NEUTRINO_API_KEY = "test-api-key"
    process.env.NEUTRINO_USER_ID = "test-user-id"
    vi.spyOn(console, "error").mockImplementation(() => {})

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("temporary error", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ valid: true, card_brand: "VISA" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

    vi.stubGlobal("fetch", fetchMock)

    const response = await callNeutrinoApi("405708")

    expect(response.valid).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
