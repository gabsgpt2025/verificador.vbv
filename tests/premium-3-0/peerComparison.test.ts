import { describe, expect, it } from "vitest"

import { comparePeer } from "@/lib/premium-3-0/peerComparison"
import type { BinApiData } from "@/lib/premium-3-0/types"

function makeBin(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: "405708",
    binLength: 6,
    source: "INTERNAL",
    ...overrides,
  }
}

describe("comparePeer", () => {
  it("gera cohort key country-type-level", () => {
    const result = comparePeer(makeBin({ countryCode: "BR", type: "CREDIT", category: "GOLD" }), 40)
    expect(result.cohortKey).toBe("BR-CREDIT-GOLD")
  })

  it("retorna percentil entre 0 e 100", () => {
    const result = comparePeer(makeBin({ countryCode: "US", type: "DEBIT", category: "STANDARD" }), 22)
    expect(result.percentile).toBeGreaterThanOrEqual(1)
    expect(result.percentile).toBeLessThanOrEqual(99)
  })

  it("retorna descrição textual no formato esperado", () => {
    const result = comparePeer(makeBin({ countryCode: "GB", type: "CREDIT", category: "PLATINUM" }), 55)
    expect(result.description).toContain("melhor que")
    expect(result.description).toContain("% dos cartões similares")
  })

  it("é determinístico para mesmo cohort e score", () => {
    const bin = makeBin({ countryCode: "BR", type: "CREDIT", category: "GOLD" })
    expect(comparePeer(bin, 33)).toEqual(comparePeer(bin, 33))
  })
})
