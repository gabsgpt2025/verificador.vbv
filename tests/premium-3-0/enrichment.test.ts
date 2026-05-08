import { describe, expect, it } from "vitest"

import { cardLevelRiskAdjustment, enrichGeo, enrichTemporal, lookupBank } from "@/lib/premium-3-0/enrichment"

describe("premium enrichment modules", () => {
  it("faz lookup fuzzy de banco", () => {
    const bank = lookupBank("Bradesco S.A.")

    expect(bank).not.toBeNull()
    expect(bank?.threeDsAdoption).toBeGreaterThanOrEqual(90)
  })

  it("aplica ajuste de risco de nível de cartão", () => {
    expect(cardLevelRiskAdjustment("BLACK", "CREDIT", false, false)).toBe(-15)
    expect(cardLevelRiskAdjustment("STANDARD", "CREDIT", true, false)).toBe(25)
    expect(cardLevelRiskAdjustment("BUSINESS", "CREDIT", false, true)).toBe(5)
  })

  it("gera geo e temporal contextos determinísticos", () => {
    const geo = enrichGeo("BR", { ipCountry: "US", ipCity: "New York" })
    const temporal = enrichTemporal(Date.UTC(2026, 4, 11, 23, 0, 0))

    expect(geo.ipCountryMatch).toBe(false)
    expect(geo.ipCountryTier).toBe("tier1")
    expect(temporal.isNightTime).toBe(true)
    expect(temporal.dayOfWeek).toBe("MONDAY")
  })
})
