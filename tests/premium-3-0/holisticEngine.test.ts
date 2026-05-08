import { describe, expect, it } from "vitest"

import { calculateHolisticRisk, runHolisticAnalysis } from "@/lib/premium-3-0"
import { enrichGeo, enrichTemporal, lookupBank } from "@/lib/premium-3-0/enrichment"
import type { BinApiData } from "@/lib/premium-3-0/types"

function makeBin(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: "553133",
    binLength: 6,
    brand: "MASTERCARD",
    type: "CREDIT",
    category: "BLACK",
    countryCode: "BR",
    countryName: "Brazil",
    issuer: "Bradesco S.A.",
    source: "NEUTRINO",
    ...overrides,
  }
}

describe("holisticEngine deterministic calculations", () => {
  it("calcula 6 dimensões sem zero quando contexto existe", () => {
    const binData = makeBin()
    const geo = enrichGeo("BR", { ipCountry: "US" })
    const temporal = enrichTemporal(Date.UTC(2026, 4, 11, 23, 0, 0))
    const bank = lookupBank(binData.issuer ?? "")

    const risk = calculateHolisticRisk({
      binData,
      geo,
      temporal,
      bank,
      amount: 120_000,
      currency: "BRL",
      userAgent: "Mozilla/5.0",
      history: [{ bin: "553133", timestamp: Date.UTC(2026, 4, 11, 22, 40, 0), countryCode: "BR" }],
    })

    expect(risk.temporalRisk).toBeGreaterThan(0)
    expect(risk.geographicRisk).toBeGreaterThan(0)
    expect(risk.deviceRisk).toBeGreaterThan(0)
    expect(risk.gatewayRisk).toBeGreaterThanOrEqual(0)
  })

  it("eleva risco comportamental com alta velocidade", () => {
    const now = Date.UTC(2026, 4, 11, 12, 0, 0)
    const result = runHolisticAnalysis(makeBin(), {
      timestamp: now,
      history: [
        { bin: "553133", timestamp: now - 10 * 60_000, countryCode: "BR" },
        { bin: "553133", timestamp: now - 20 * 60_000, countryCode: "BR" },
        { bin: "553133", timestamp: now - 30 * 60_000, countryCode: "BR" },
        { bin: "553133", timestamp: now - 40 * 60_000, countryCode: "US" },
      ],
      ipCountryCode: "US",
      userAgent: "curl/8.1",
      amount: 100,
      currency: "BRL",
    })

    expect(result.behavioralRisk.score).toBeGreaterThanOrEqual(70)
    expect(result.deviceRisk.score).toBe(80)
    expect(result.geographicRisk.score).toBeGreaterThan(0)
  })
})
