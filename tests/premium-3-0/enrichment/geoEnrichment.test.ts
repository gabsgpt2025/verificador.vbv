import { describe, expect, it } from "vitest"

import { COUNTRY_RISK_TIER, enrichGeo, extractGeoFromHeaders, getCountryRiskTier } from "@/lib/premium-3-0/enrichment/geoEnrichment"

describe("geoEnrichment", () => {
  it("expõe tabela SSOT com tier LOW para BR", () => {
    expect(COUNTRY_RISK_TIER.BR).toBe("LOW")
    expect(getCountryRiskTier("BR")).toBe("LOW")
  })

  it("adiciona +25 quando BIN e IP divergem", () => {
    const result = enrichGeo("BR", "8.8.8.8", "US")
    expect(result.ipCountryMatch).toBe(false)
    expect(result.score).toBeGreaterThanOrEqual(40)
  })

  it("reduz risco quando BIN e IP estão alinhados", () => {
    const result = enrichGeo("BR", "200.147.67.1", "BR")
    expect(result.ipCountryMatch).toBe(true)
    expect(result.score).toBeLessThanOrEqual(15)
  })

  it("lê headers Vercel/CF para país e IP", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "GB",
      "x-vercel-ip-country-region": "ENG",
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      "cf-ipcountry": "DE",
    })
    const extracted = extractGeoFromHeaders(headers)
    expect(extracted.ipCountry).toBe("GB")
    expect(extracted.ipRegion).toBe("ENG")
    expect(extracted.ipAddress).toBe("203.0.113.10")
  })
})
