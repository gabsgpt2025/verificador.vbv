import { afterEach, describe, expect, it, vi } from "vitest"

const {
  enrichGeoMock,
  enrichDeviceMock,
  enrichGatewayMock,
} = vi.hoisted(() => ({
  enrichGeoMock: vi.fn(),
  enrichDeviceMock: vi.fn(),
  enrichGatewayMock: vi.fn(),
}))

vi.mock("@/lib/premium-3-0/enrichment/geoEnrichment", async () => {
  const actual = await vi.importActual<typeof import("@/lib/premium-3-0/enrichment/geoEnrichment")>("@/lib/premium-3-0/enrichment/geoEnrichment")
  return {
    ...actual,
    enrichGeo: enrichGeoMock,
  }
})

vi.mock("@/lib/premium-3-0/enrichment/deviceEnrichment", async () => {
  const actual = await vi.importActual<typeof import("@/lib/premium-3-0/enrichment/deviceEnrichment")>("@/lib/premium-3-0/enrichment/deviceEnrichment")
  return {
    ...actual,
    enrichDevice: enrichDeviceMock,
  }
})

vi.mock("@/lib/premium-3-0/enrichment/gatewayRisk", async () => {
  const actual = await vi.importActual<typeof import("@/lib/premium-3-0/enrichment/gatewayRisk")>("@/lib/premium-3-0/enrichment/gatewayRisk")
  return {
    ...actual,
    enrichGateway: enrichGatewayMock,
  }
})

import { runHolisticAnalysis } from "@/lib/premium-3-0/holisticEngine"

const binData = {
  bin: "411111",
  binLength: 6,
  brand: "VISA",
  type: "CREDIT",
  category: "STANDARD",
  countryCode: "BR",
  issuer: "Banco X",
  source: "NEUTRINO" as const,
}

describe("holisticEngine neutrino confidence", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("increases ensembleConfidence when neutrino data is used", async () => {
    enrichGeoMock.mockReturnValue({
      score: 20,
      factors: [],
      countryRiskTier: "TIER1",
      ipCountryCode: "BR",
      ipCountry: null,
      ipCity: null,
      ipCountryMatch: true,
      ipCountryTier: "tier1" as const,
      distanceKm: null,
      sourcesUsed: ["neutrino-ip-info"],
    })
    enrichDeviceMock.mockReturnValue({
      score: 20,
      factors: [],
      deviceType: "desktop",
      sourcesUsed: ["neutrino-ua-lookup"],
    })
    enrichGatewayMock.mockReturnValue({
      score: 20,
      factors: [],
      dataAvailable: true,
      sourcesUsed: [],
    })

    const result = await runHolisticAnalysis(binData, {
      timestamp: Date.now(),
      isFirstTransaction: false,
      userAgent: "Mozilla/5.0",
      ipCountryCode: "BR",
    })

    expect(result.ensembleConfidence).toBeGreaterThan(60)
    expect(result.sourcesUsed).toContain("neutrino-ip-info")
    expect(result.sourcesUsed).toContain("neutrino-ua-lookup")
  })
})
