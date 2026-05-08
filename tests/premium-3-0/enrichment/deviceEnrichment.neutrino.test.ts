import { afterEach, describe, expect, it, vi } from "vitest"

const { fetchUaLookupDetailedMock } = vi.hoisted(() => ({
  fetchUaLookupDetailedMock: vi.fn(),
}))

vi.mock("@/lib/premium-3-0/neutrino", () => ({
  fetchUaLookupDetailed: fetchUaLookupDetailedMock,
}))

import { enrichDevice } from "@/lib/premium-3-0/enrichment/deviceEnrichment"

describe("deviceEnrichment with neutrino", () => {
  afterEach(() => {
    vi.clearAllMocks()
    process.env.NEUTRINO_UA_LOOKUP_ENABLED = "false"
  })

  it("uses neutrino bot classification", async () => {
    process.env.NEUTRINO_UA_LOOKUP_ENABLED = "true"
    fetchUaLookupDetailedMock.mockResolvedValue({
      data: { is_bot: true, bot_category: "scraper", browser: "HeadlessChrome" },
      meta: { networkSuccess: true },
    })

    const result = await enrichDevice("Mozilla/5.0 (compatible)")
    expect(result.isBot).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(40)
  })

  it("falls back to local parser when neutrino fails", async () => {
    process.env.NEUTRINO_UA_LOOKUP_ENABLED = "true"
    fetchUaLookupDetailedMock.mockRejectedValue(new Error("unavailable"))

    const result = await enrichDevice("curl/8.1")
    expect(result.deviceType).toBe("bot")
    expect(result.factors.some((factor) => factor.label === "neutrino_ua_unavailable")).toBe(true)
  })
})
