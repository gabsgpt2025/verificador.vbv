import { beforeEach, describe, expect, it, vi } from "vitest"

const { callNeutrinoApiMock, normalizeNeutrinoBinResponseMock, lookupMastercardBinMock } = vi.hoisted(() => ({
  callNeutrinoApiMock: vi.fn(),
  normalizeNeutrinoBinResponseMock: vi.fn(),
  lookupMastercardBinMock: vi.fn(),
}))

vi.mock("@/lib/premium-3-0/neutrino-api", () => ({
  callNeutrinoApi: callNeutrinoApiMock,
}))

vi.mock("@/lib/premium-3-0/normalizeBinApiResponse", () => ({
  normalizeNeutrinoBinResponse: normalizeNeutrinoBinResponseMock,
}))

vi.mock("@/lib/integrations/mastercard", () => ({
  lookupMastercardBin: lookupMastercardBinMock,
  isLikelyMastercardFamilyBin: (bin: string) => bin.startsWith("55") || bin.startsWith("22") || bin.startsWith("6"),
}))

import { lookupBinMultiSource } from "@/lib/premium-3-0/multiSourceLookup"
import type { BinApiData } from "@/lib/premium-3-0/types"

function makeNeutrino(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: "553133",
    binLength: 6,
    brand: "MASTERCARD",
    type: "CREDIT",
    category: "BLACK",
    countryCode: "BR",
    countryName: "Brazil",
    issuer: "Bradesco",
    source: "NEUTRINO",
    ...overrides,
  }
}

describe("lookupBinMultiSource", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callNeutrinoApiMock.mockResolvedValue({ card_brand: "MASTERCARD" })
    normalizeNeutrinoBinResponseMock.mockReturnValue(makeNeutrino())
  })

  it("retorna HIGH quando ambas as fontes concordam", async () => {
    lookupMastercardBinMock.mockResolvedValue({
      bin: "553133",
      binLength: 6,
      brand: "MASTERCARD",
      productCode: "MWE",
      productName: "World Elite",
      productCategory: "COMMERCIAL",
      cardType: "CREDIT",
      countryCode: "BRA",
      countryName: "Brazil",
      issuerName: "Bradesco",
      issuerCountry: "Brazil",
      acceptanceBrand: "MASTERCARD",
      source: "MASTERCARD",
      raw: { ok: true },
    })

    const result = await lookupBinMultiSource("553133")

    expect(result.consensus.confidence).toBe("HIGH")
    expect(result.consensus.discrepancies).toEqual([])
    expect(result.primary.source).toBe("MASTERCARD")
    expect(result.primary.category).toBe("World Elite")
  })

  it("retorna MEDIUM quando há uma discrepância", async () => {
    lookupMastercardBinMock.mockResolvedValue({
      bin: "553133",
      binLength: 6,
      brand: "MASTERCARD",
      productCode: "MWE",
      productName: "World Elite",
      productCategory: "COMMERCIAL",
      cardType: "DEBIT",
      countryCode: "BRA",
      countryName: "Brazil",
      issuerName: "Bradesco",
      issuerCountry: "Brazil",
      acceptanceBrand: "MASTERCARD",
      source: "MASTERCARD",
      raw: { ok: true },
    })

    const result = await lookupBinMultiSource("553133")

    expect(result.consensus.confidence).toBe("MEDIUM")
    expect(result.consensus.typeAgreement).toBe(false)
    expect(result.consensus.discrepancies).toContain("type mismatch: Neutrino=CREDIT, Mastercard=DEBIT")
  })

  it("retorna LOW quando apenas uma fonte está disponível", async () => {
    lookupMastercardBinMock.mockResolvedValue(null)

    const result = await lookupBinMultiSource("411111")

    expect(result.consensus.confidence).toBe("LOW")
    expect(result.sources.neutrino?.source).toBe("NEUTRINO")
    expect(result.sources.mastercard).toBeNull()
    expect(result.primary.source).toBe("NEUTRINO")
  })
})
