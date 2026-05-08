import { afterEach, describe, expect, it, vi } from "vitest"

const { fetchIpInfoDetailedMock, fetchIpBlocklistDetailedMock } = vi.hoisted(() => ({
  fetchIpInfoDetailedMock: vi.fn(),
  fetchIpBlocklistDetailedMock: vi.fn(),
}))

vi.mock("@/lib/premium-3-0/neutrino", () => ({
  fetchIpInfoDetailed: fetchIpInfoDetailedMock,
  fetchIpBlocklistDetailed: fetchIpBlocklistDetailedMock,
}))

import { enrichGeo } from "@/lib/premium-3-0/enrichment/geoEnrichment"

describe("geoEnrichment with neutrino", () => {
  afterEach(() => {
    vi.clearAllMocks()
    process.env.NEUTRINO_IP_INFO_ENABLED = "false"
    process.env.NEUTRINO_IP_BLOCKLIST_ENABLED = "false"
  })

  it("increases score when proxy is true", async () => {
    process.env.NEUTRINO_IP_INFO_ENABLED = "true"
    process.env.NEUTRINO_IP_BLOCKLIST_ENABLED = "true"

    fetchIpInfoDetailedMock.mockResolvedValue({
      data: { country_code: "BR", is_proxy: true, is_vpn: false, is_tor: false },
      meta: { networkSuccess: true },
    })
    fetchIpBlocklistDetailedMock.mockResolvedValue({
      data: { blocklists: [] },
      meta: { networkSuccess: true },
    })

    const result = await enrichGeo("BR", "8.8.8.8", "BR")
    expect(result.score).toBeGreaterThan(15)
    expect(result.factors.some((factor) => factor.label.includes("inteligência real de IP"))).toBe(true)
  })

  it("adds fallback factor when neutrino is unavailable", async () => {
    process.env.NEUTRINO_IP_INFO_ENABLED = "true"
    fetchIpInfoDetailedMock.mockRejectedValue(new Error("timeout"))
    fetchIpBlocklistDetailedMock.mockResolvedValue(null)

    const result = await enrichGeo("BR", "8.8.8.8", "BR")
    expect(result.factors.some((factor) => factor.label === "neutrino_ip_unavailable")).toBe(true)
  })
})
