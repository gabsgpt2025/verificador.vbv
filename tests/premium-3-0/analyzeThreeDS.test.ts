import { describe, expect, it } from "vitest"

import { analyzeThreeDS, analyzeThreeDSExtended } from "@/lib/premium-3-0/analyzeThreeDS"
import type { BinApiData } from "@/lib/premium-3-0/types"

function makeBin(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: "405708",
    binLength: 6,
    source: "INTERNAL",
    ...overrides,
  }
}

describe("analyzeThreeDSExtended", () => {
  it("mantém compatibilidade com analyzeThreeDS base", () => {
    const bin = makeBin({ brand: "VISA", type: "CREDIT", countryCode: "BR", issuer: "Bradesco" })
    const base = analyzeThreeDS(bin)
    const extended = analyzeThreeDSExtended(bin)
    expect(extended.status).toBe(base.status)
    expect(extended.frictionlessProbability).toBe(base.frictionlessProbability)
  })

  it("retorna campos estendidos de probabilidade", () => {
    const result = analyzeThreeDSExtended(
      makeBin({ brand: "VISA", type: "CREDIT", countryCode: "GB", issuer: "Barclays" }),
      { amount: 1200, currency: "EUR" },
    )
    expect(result.frictionlessProbability).toBeGreaterThanOrEqual(0)
    expect(result.frictionlessProbability).toBeLessThanOrEqual(100)
    expect(result.bypassProbability).toBeGreaterThanOrEqual(0)
    expect(result.bypassProbability).toBeLessThanOrEqual(100)
  })

  it("mapeia mecanismos para SSOT BypassMechanism", () => {
    const result = analyzeThreeDSExtended(
      makeBin({ brand: "VISA", type: "CREDIT", category: "RECURRING", countryCode: "BR", issuer: "Itaú" }),
      { amount: 500, currency: "EUR" },
    )
    expect(result.bypassMechanisms.length).toBeGreaterThan(0)
    expect(["NONE", "FRICTIONLESS_3DS2", "SCA_EXEMPTION", "3DS_NOMINAL"]).toContain(result.bypassMechanisms[0])
  })

  it("continua inferindo risco alto para país crítico + prepaid", () => {
    const result = analyzeThreeDSExtended(
      makeBin({ brand: "VISA", type: "PREPAID", isPrepaid: true, countryCode: "VE" }),
      { amount: 9000, currency: "USD" },
    )
    expect(result.challengeProbability).toBeGreaterThanOrEqual(50)
    expect(result.status).toBe("LIKELY_INACTIVE")
  })
})
