import { describe, expect, it } from "vitest"

import {
  BANK_REP_WEIGHT,
  CARD_LEVEL_WEIGHT,
  HOLISTIC_DIMENSION_WEIGHTS,
  runHolisticAnalysis,
} from "@/lib/premium-3-0/holisticEngine"
import type { BinApiData } from "@/lib/premium-3-0/types"

function makeBin(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: "55323000",
    binLength: 8,
    source: "INTERNAL",
    ...overrides,
  }
}

describe("runHolisticAnalysis", () => {
  it("aplica pesos 6D nomeados que somam 100", () => {
    const total = Object.values(HOLISTIC_DIMENSION_WEIGHTS).reduce((acc, value) => acc + value, 0)
    expect(HOLISTIC_DIMENSION_WEIGHTS.binRisk).toBe(30)
    expect(HOLISTIC_DIMENSION_WEIGHTS.geographicRisk).toBe(20)
    expect(HOLISTIC_DIMENSION_WEIGHTS.behavioralRisk).toBe(15)
    expect(HOLISTIC_DIMENSION_WEIGHTS.gatewayRisk).toBe(15)
    expect(HOLISTIC_DIMENSION_WEIGHTS.temporalRisk).toBe(10)
    expect(HOLISTIC_DIMENSION_WEIGHTS.deviceRisk).toBe(10)
    expect(total).toBe(100)
  })

  it("expõe pesos de composição comportamental", () => {
    expect(BANK_REP_WEIGHT).toBe(0.6)
    expect(CARD_LEVEL_WEIGHT).toBe(0.4)
  })

  it("retorna baseline neutro (30) quando dimensões estão sem dados", () => {
    const result = runHolisticAnalysis(
      makeBin({
        source: "UNKNOWN",
      }),
      {
        timestamp: Date.UTC(2026, 4, 12, 14, 0, 0),
      },
    )

    expect(result.dimensions.binRisk.score).toBe(30)
    expect(result.dimensions.geographicRisk.score).toBe(30)
    expect(result.dimensions.deviceRisk.score).toBe(30)
    expect(result.dimensions.gatewayRisk.score).toBe(30)
    expect(result.dimensions.binRisk.dataAvailable).toBe(false)
    expect(result.dimensions.deviceRisk.dataAvailable).toBe(false)
  })

  it("gera risco baixo para cenário favorável", () => {
    const result = runHolisticAnalysis(
      makeBin({
        brand: "MASTERCARD",
        type: "CREDIT",
        category: "BLACK",
        countryCode: "BR",
        countryName: "Brazil",
        issuer: "Bradesco",
      }),
      {
        amount: 1500,
        currency: "BRL",
        mcc: "5411",
        ipAddress: "200.147.67.1",
        ipCountryCode: "BR",
        timestamp: Date.UTC(2026, 4, 12, 14, 0, 0),
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/136.0",
        isFirstTransaction: false,
      },
    )

    expect(result.overallScore).toBeLessThan(40)
    expect(result.level).toBe("LOW")
    expect(result.recommendation).toBe("APPROVE")
    expect(result.ensembleConfidence).toBeGreaterThan(70)
  })

  it("gera risco alto para cenário crítico", () => {
    const result = runHolisticAnalysis(
      makeBin({
        brand: "VISA",
        type: "PREPAID",
        category: "VIRTUAL",
        countryCode: "RU",
        issuer: null,
        isPrepaid: true,
        source: "NEUTRINO",
      }),
      {
        amount: 12000,
        currency: "USD",
        mcc: "7995",
        ipAddress: "8.8.8.8",
        ipCountryCode: "US",
        timestamp: Date.UTC(2026, 4, 10, 2, 0, 0),
        userAgent: "python-requests/2.31.0",
        isFirstTransaction: true,
      },
    )

    expect(result.dimensions.geographicRisk.score).toBeGreaterThanOrEqual(80)
    expect(result.dimensions.deviceRisk.score).toBeGreaterThanOrEqual(50)
    expect(result.overallScore).toBeGreaterThanOrEqual(60)
    expect(["CHALLENGE", "DECLINE"]).toContain(result.recommendation)
  })

  it("mantém resultado determinístico para mesmo input", () => {
    const inputBin = makeBin({
      brand: "VISA",
      type: "CREDIT",
      category: "GOLD",
      countryCode: "GB",
      issuer: "Barclays",
    })
    const inputContext = {
      amount: 3000,
      currency: "EUR",
      timestamp: Date.UTC(2026, 4, 13, 20, 0, 0),
      ipCountryCode: "GB",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) Mobile Safari/605.1",
    }

    const first = runHolisticAnalysis(inputBin, inputContext)
    const second = runHolisticAnalysis(inputBin, inputContext)
    expect(second).toEqual(first)
  })
})
