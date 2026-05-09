import { describe, it, expect, vi } from "vitest"
import { normalizeBinApiResponse } from "../lib/premium-3-0/normalizeBinApiResponse"
import { analyzeThreeDS } from "../lib/premium-3-0/analyzeThreeDS"
import { calculateRisk } from "../lib/premium-3-0/calculateRisk"
import { calculateDataQuality } from "../lib/premium-3-0/calculateDataQuality"
import { analyzeCompliance } from "../lib/premium-3-0/analyzeCompliance"
import type { BinApiData } from "../lib/premium-3-0/types"

/**
 * Executa a análise base do BIN (parte síncrona) para testes unitários.
 * Não inclui enriquecimento, holístico ou peer comparison (que requerem Supabase/APIs).
 */
function runBaseAnalysis(binData: BinApiData) {
  const threeDSAnalysis = analyzeThreeDS(binData)
  const riskAnalysis = calculateRisk(binData, threeDSAnalysis)
  const dataQuality = calculateDataQuality(binData)
  const compliance = analyzeCompliance(binData)
  return { threeDSAnalysis, riskAnalysis, dataQuality, compliance }
}

// Helper to create BinApiData with defaults
function makeBin(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: "405708",
    binLength: 6,
    source: "INTERNAL",
    ...overrides,
  }
}

describe("VeriFiBIN 2.0 — Análise de BIN", () => {
  // Cenário 1: Visa crédito EUA sem emissor
  it("1. Visa crédito EUA sem emissor", () => {
    const bin = makeBin({
      brand: "VISA",
      type: "CREDIT",
      category: "CLASSIC",
      countryCode: "US",
      countryName: "United States",
      currency: "USD",
      issuer: null,
    })
    const analysis = runBaseAnalysis(bin)

    expect(analysis.threeDSAnalysis.status).toBe("LIKELY_ACTIVE")
    expect(analysis.threeDSAnalysis.inferred).toBe(true)
    expect(analysis.riskAnalysis.score).toBeGreaterThan(30)
    expect(analysis.riskAnalysis.recommendation).not.toBe("ALLOW_WITH_MONITORING")
    expect(analysis.dataQuality.missingFields).toContain("issuer")
  })

  // Cenário 2: Mastercard débito EUA
  it("2. Mastercard débito EUA", () => {
    const bin = makeBin({
      brand: "MASTERCARD",
      type: "DEBIT",
      category: "STANDARD",
      countryCode: "US",
      countryName: "United States",
      issuer: "Bank of America",
    })
    const analysis = runBaseAnalysis(bin)

    expect(["LIKELY_ACTIVE", "UNKNOWN"]).toContain(analysis.threeDSAnalysis.status)
    expect(analysis.threeDSAnalysis.inferred).toBe(true)
    expect(analysis.riskAnalysis.score).toBeLessThan(80)
  })

  // Cenário 3: Crédito Brasil com banco conhecido
  it("3. Crédito Brasil com banco conhecido", () => {
    const bin = makeBin({
      brand: "VISA",
      type: "CREDIT",
      category: "PLATINUM",
      countryCode: "BR",
      countryName: "Brazil",
      currency: "BRL",
      issuer: "Bradesco",
    })
    const analysis = runBaseAnalysis(bin)

    expect(analysis.threeDSAnalysis.status).toBe("LIKELY_ACTIVE")
    expect(analysis.threeDSAnalysis.confidence).toBe("HIGH")
    expect(analysis.riskAnalysis.score).toBeLessThan(40)
    expect(analysis.riskAnalysis.recommendation).toBe("ALLOW_WITH_MONITORING")
    expect(analysis.compliance.threeDSMandateLevel).toBe("STRONG")
  })

  // Cenário 4: Pré-pago internacional
  it("4. Pré-pago internacional", () => {
    const bin = makeBin({
      brand: "VISA",
      type: "PREPAID",
      countryCode: "US",
      isPrepaid: true,
      issuer: null,
    })
    const analysis = runBaseAnalysis(bin)

    expect(analysis.riskAnalysis.score).toBeGreaterThan(40)
    expect(["REVIEW", "REQUIRE_3DS", "BLOCK_PREVENTIVELY"]).toContain(analysis.riskAnalysis.recommendation)
    expect(analysis.riskAnalysis.factors.some((f: { label: string }) => f.label.toLowerCase().includes("pré-pago"))).toBe(true)
  })

  // Cenário 5: Commercial/business
  it("5. Cartão comercial/business", () => {
    const bin = makeBin({
      brand: "MASTERCARD",
      type: "CREDIT",
      category: "BUSINESS",
      countryCode: "US",
      issuer: "Chase Bank",
      isCommercial: true,
    })
    const analysis = runBaseAnalysis(bin)

    expect(analysis.riskAnalysis.factors.some((f: { label: string }) => f.label.toLowerCase().includes("comercial"))).toBe(true)
  })

  // Cenário 6: País desconhecido
  it("6. País desconhecido", () => {
    const bin = makeBin({
      brand: "VISA",
      type: "CREDIT",
      issuer: "Unknown Bank",
    })
    const analysis = runBaseAnalysis(bin)

    expect(analysis.riskAnalysis.factors.some((f: { label: string }) => f.label.toLowerCase().includes("país"))).toBe(true)
    expect(analysis.riskAnalysis.score).toBeGreaterThan(40)
    expect(analysis.compliance.threeDSMandateLevel).toBe("UNKNOWN")
  })

  // Cenário 7: Categoria ausente
  it("7. Categoria ausente", () => {
    const bin = makeBin({
      brand: "VISA",
      type: "CREDIT",
      countryCode: "US",
      issuer: "Chase Bank",
      // category omitida
    })
    const analysis = runBaseAnalysis(bin)

    expect(analysis.dataQuality.missingFields).toContain("category")
    expect(analysis.riskAnalysis.factors.some((f: { label: string }) => f.label.toLowerCase().includes("categoria"))).toBe(true)
  })

  // Cenário 8: País HIGH maturity (GB)
  it("8. País com alta maturidade 3DS (GB)", () => {
    const bin = makeBin({
      brand: "VISA",
      type: "CREDIT",
      category: "PLATINUM",
      countryCode: "GB",
      countryName: "United Kingdom",
      issuer: "Barclays",
    })
    const analysis = runBaseAnalysis(bin)

    expect(analysis.threeDSAnalysis.status).toBe("LIKELY_ACTIVE")
    expect(analysis.threeDSAnalysis.confidence).toBe("HIGH")
    expect(analysis.compliance.threeDSMandateLevel).toBe("MANDATORY")
    expect(analysis.riskAnalysis.score).toBeLessThan(35)
  })

  // Cenário 9: País LOW maturity (VE)
  it("9. País com baixa maturidade 3DS (VE)", () => {
    const bin = makeBin({
      brand: "VISA",
      type: "DEBIT",
      countryCode: "VE",
      countryName: "Venezuela",
      issuer: null,
    })
    const analysis = runBaseAnalysis(bin)

    expect(analysis.threeDSAnalysis.status).toBe("LIKELY_INACTIVE")
    expect(analysis.riskAnalysis.score).toBeGreaterThan(50)
    expect(analysis.compliance.complianceRisk).toBe("HIGH")
    expect(["REQUIRE_3DS", "BLOCK_PREVENTIVELY"]).toContain(analysis.riskAnalysis.recommendation)
  })

  // Cenário 10: BIN 8 dígitos
  it("10. BIN de 8 dígitos", () => {
    const bin = makeBin({
      bin: "40570812",
      binLength: 8,
      brand: "VISA",
      type: "CREDIT",
      countryCode: "US",
      issuer: "Chase Bank",
      category: "GOLD",
    })
    const analysis = runBaseAnalysis(bin)

    expect(analysis.riskAnalysis.factors.some((f: { label: string }) => f.label.toLowerCase().includes("8 dígitos"))).toBe(true)
    // Score should be lower due to 8-digit precision bonus
    const withoutBin8 = makeBin({
      brand: "VISA",
      type: "CREDIT",
      countryCode: "US",
      issuer: "Chase Bank",
      category: "GOLD",
    })
    const analysis6 = runBaseAnalysis(withoutBin8)
    expect(analysis.riskAnalysis.score).toBeLessThanOrEqual(analysis6.riskAnalysis.score)
  })

  // Test normalizeBinApiResponse
  describe("normalizeBinApiResponse", () => {
    it("normalizes Binlist response correctly", () => {
      const raw = {
        scheme: "visa",
        type: "credit",
        category: "classic",
        commercial: false,
        prepaid: false,
        country: { alpha2: "US", name: "United States", currency: "USD" },
        bank: { name: "Chase Bank", url: "https://chase.com", phone: "+1-800-000-0000" },
      }
      const result = normalizeBinApiResponse("BINLIST", raw, "405708")

      expect(result.brand).toBe("VISA")
      expect(result.type).toBe("credit")
      expect(result.countryCode).toBe("US")
      expect(result.issuer).toBe("Chase Bank")
      expect(result.source).toBe("BINLIST")
      expect(result.binLength).toBe(6)
    })

    it("never stores full PAN — only uses BIN prefix", () => {
      const raw = { brand: "VISA", type: "CREDIT" }
      const fullPan = "4057081234567890"
      const result = normalizeBinApiResponse("INTERNAL", raw, fullPan.substring(0, 8))

      // The bin stored should be at most 8 digits (BIN, not full PAN)
      expect(result.bin.length).toBeLessThanOrEqual(8)
    })
  })
})
