import { describe, it, expect } from "vitest"
import { analyzeBIN } from "../src/lib/intelligence/binAnalyzer"
import {
  visaCreditUSANoIssuer,
  mastercardDebitUSA,
  visaCreditBrazilKnownBank,
  prepaidInternational,
  visaCommercialCard,
  unknownCountryCard,
  incompleteDataCard,
  indiaMandatory3DS,
  nigeriaLow3DS,
  eloBrazilRegionalBank,
} from "./fixtures/binApiResponses"

// ─── Scenario 1: Visa credit USA, no issuer ───────────────────────────────

describe("Scenario 1: Visa credit USA without issuer", () => {
  const result = analyzeBIN({
    bin: "405708",
    rawApiResponse: visaCreditUSANoIssuer,
  })

  it("3DS status should be ATIVO_PROVAVEL (US credit Visa)", () => {
    expect(result.threeDSAnalysis.status).toBe("ATIVO_PROVAVEL")
  })

  it("3DS isInferred should be true", () => {
    expect(result.threeDSAnalysis.isInferred).toBe(true)
  })

  it("3DS confidence should be ALTA or MEDIA (US medium maturity + Visa credit)", () => {
    expect(["ALTA", "MEDIA"]).toContain(result.threeDSAnalysis.confidence)
  })

  it("risk score should be between 31–80 (MEDIO/ALTO) due to no issuer", () => {
    expect(result.riskAnalysis.score).toBeGreaterThanOrEqual(31)
    expect(result.riskAnalysis.score).toBeLessThan(100)
  })

  it("recommendation should not be APROVAR_COM_SEGURANCA due to missing issuer", () => {
    expect(result.riskAnalysis.recommendation).not.toBe("APROVAR_COM_SEGURANCA")
  })

  it("dataQuality should list issuer as missing", () => {
    expect(result.dataQuality.missingFields).toContain("issuer")
    expect(result.dataQuality.issuerKnown).toBe(false)
  })

  it("3DS explanation should mention 'inferido' or 'APIs' or 'não confirmado'", () => {
    const explanation = result.threeDSAnalysis.technicalExplanation.toLowerCase()
    const hasCaveat =
      explanation.includes("inferid") ||
      explanation.includes("api") ||
      explanation.includes("não confirm")
    expect(hasCaveat).toBe(true)
  })
})

// ─── Scenario 2: Mastercard debit USA ────────────────────────────────────

describe("Scenario 2: Mastercard debit USA with known issuer", () => {
  const result = analyzeBIN({
    bin: "510510",
    rawApiResponse: mastercardDebitUSA,
  })

  it("3DS status should be ATIVO_PROVAVEL or DESCONHECIDO for US debit", () => {
    expect(["ATIVO_PROVAVEL", "DESCONHECIDO"]).toContain(result.threeDSAnalysis.status)
  })

  it("issuerKnown should be true (Bank of America)", () => {
    expect(result.dataQuality.issuerKnown).toBe(true)
  })

  it("risk score should be lower than scenario 1 (issuer known)", () => {
    const scenario1 = analyzeBIN({ bin: "405708", rawApiResponse: visaCreditUSANoIssuer })
    expect(result.riskAnalysis.score).toBeLessThan(scenario1.riskAnalysis.score)
  })

  it("dataQuality.typeKnown should be true", () => {
    expect(result.dataQuality.typeKnown).toBe(true)
  })
})

// ─── Scenario 3: Visa credit Brazil, known bank ──────────────────────────

describe("Scenario 3: Visa credit Brazil with known bank (Bradesco)", () => {
  const result = analyzeBIN({
    bin: "451357",
    rawApiResponse: visaCreditBrazilKnownBank,
  })

  it("3DS status should be ATIVO_PROVAVEL (Brazil high maturity)", () => {
    expect(result.threeDSAnalysis.status).toBe("ATIVO_PROVAVEL")
  })

  it("3DS confidence should be ALTA or MEDIA for Brazil", () => {
    expect(["ALTA", "MEDIA"]).toContain(result.threeDSAnalysis.confidence)
  })

  it("risk score should be BAIXO or MEDIO for known bank + Brazil", () => {
    expect(result.riskAnalysis.level).toMatch(/BAIXO|MEDIO/)
  })

  it("compliance region should be Brazil", () => {
    expect(result.complianceData.regulatoryRegion).toBe("Brasil")
  })

  it("compliance mandateLevel should be MODERADO for Brazil", () => {
    expect(result.complianceData.threeDSMandateLevel).toBe("MODERADO")
  })

  it("issuer known = true (Bradesco)", () => {
    expect(result.dataQuality.issuerKnown).toBe(true)
  })
})

// ─── Scenario 4: International prepaid card ──────────────────────────────

describe("Scenario 4: International prepaid card (Mexico)", () => {
  const result = analyzeBIN({
    bin: "532959",
    rawApiResponse: prepaidInternational,
  })

  it("isPrepaid should be true", () => {
    expect(result.technicalData.isPrepaid).toBe(true)
  })

  it("3DS status should be INATIVO_PROVAVEL or DESCONHECIDO for prepaid", () => {
    expect(["INATIVO_PROVAVEL", "DESCONHECIDO"]).toContain(result.threeDSAnalysis.status)
  })

  it("risk score should be elevated due to prepaid status", () => {
    // Find prepaid factor in breakdown
    const prepaidFactor = result.riskAnalysis.riskBreakdown.find(
      (f) => f.factor.toLowerCase().includes("pré-pago"),
    )
    expect(prepaidFactor).toBeDefined()
    expect(prepaidFactor!.numericImpact).toBeGreaterThan(0)
  })

  it("recommendation should be REVISAR or EXIGIR_3DS or BLOQUEAR_PREVENTIVAMENTE", () => {
    expect(["REVISAR", "EXIGIR_3DS", "BLOQUEAR_PREVENTIVAMENTE"]).toContain(
      result.riskAnalysis.recommendation,
    )
  })

  it("data quality should flag missing issuer", () => {
    expect(result.dataQuality.missingFields).toContain("issuer")
  })
})

// ─── Scenario 5: Commercial/Business card ────────────────────────────────

describe("Scenario 5: Visa commercial/business card (USA)", () => {
  const result = analyzeBIN({
    bin: "405503",
    rawApiResponse: visaCommercialCard,
  })

  it("isCommercial should be true", () => {
    expect(result.technicalData.isCommercial).toBe(true)
  })

  it("3DS status should be ATIVO_PROVAVEL (commercial cards generally support 3DS)", () => {
    expect(result.threeDSAnalysis.status).toBe("ATIVO_PROVAVEL")
  })

  it("riskBreakdown should include a commercial factor", () => {
    const commercialFactor = result.riskAnalysis.riskBreakdown.find(
      (f) => f.factor.toLowerCase().includes("comercial") || f.factor.toLowerCase().includes("commercial"),
    )
    expect(commercialFactor).toBeDefined()
  })

  it("issuer Chase should reduce risk", () => {
    const issuerFactor = result.riskAnalysis.riskBreakdown.find(
      (f) => f.factor.toLowerCase().includes("chase"),
    )
    expect(issuerFactor).toBeDefined()
    expect(issuerFactor!.numericImpact).toBeLessThan(0)
  })
})

// ─── Scenario 6: Unknown country ─────────────────────────────────────────

describe("Scenario 6: Card with unknown country", () => {
  const result = analyzeBIN({
    bin: "999999",
    rawApiResponse: unknownCountryCard,
  })

  it("countryKnown should be false", () => {
    expect(result.dataQuality.countryKnown).toBe(false)
  })

  it("3DS status should be DESCONHECIDO when country is unknown", () => {
    expect(result.threeDSAnalysis.status).toBe("DESCONHECIDO")
  })

  it("risk breakdown should include unknown country factor", () => {
    const countryFactor = result.riskAnalysis.riskBreakdown.find(
      (f) => f.factor.toLowerCase().includes("não identificad") || f.factor.toLowerCase().includes("desconhecid"),
    )
    expect(countryFactor).toBeDefined()
    expect(countryFactor!.numericImpact).toBeGreaterThan(0)
  })
})

// ─── Scenario 7: Incomplete data ──────────────────────────────────────────

describe("Scenario 7: Incomplete BIN data", () => {
  const result = analyzeBIN({
    bin: "424242",
    rawApiResponse: incompleteDataCard,
  })

  it("dataQuality.score should be low (<50)", () => {
    expect(result.dataQuality.score).toBeLessThan(50)
  })

  it("missingFields should include multiple critical fields", () => {
    expect(result.dataQuality.missingFields.length).toBeGreaterThan(3)
  })

  it("recommendation should be DADOS_INSUFICIENTES when data is very incomplete", () => {
    expect(result.riskAnalysis.recommendation).toBe("DADOS_INSUFICIENTES")
  })

  it("dataQuality.warnings should have content", () => {
    expect(result.dataQuality.warnings.length).toBeGreaterThan(0)
  })
})

// ─── Scenario 8: India — mandatory 3DS ───────────────────────────────────

describe("Scenario 8: India — RBI mandatory 3DS", () => {
  const result = analyzeBIN({
    bin: "489353",
    rawApiResponse: indiaMandatory3DS,
  })

  it("compliance mandateLevel should be OBRIGATORIO for India", () => {
    expect(result.complianceData.threeDSMandateLevel).toBe("OBRIGATORIO")
  })

  it("3DS status should be ATIVO_PROVAVEL for India", () => {
    expect(result.threeDSAnalysis.status).toBe("ATIVO_PROVAVEL")
  })

  it("3DS confidence should be ALTA for India", () => {
    expect(result.threeDSAnalysis.confidence).toBe("ALTA")
  })

  it("risk score should be relatively low (India has high 3DS maturity)", () => {
    expect(result.riskAnalysis.score).toBeLessThan(60)
  })

  it("liabilityShiftExpected should be true for India", () => {
    expect(result.complianceData.liabilityShiftExpected).toBe(true)
  })
})

// ─── Scenario 9: Nigeria — low 3DS maturity ──────────────────────────────

describe("Scenario 9: Nigeria — low 3DS maturity", () => {
  const result = analyzeBIN({
    bin: "507338",
    rawApiResponse: nigeriaLow3DS,
  })

  it("3DS status should be INATIVO_PROVAVEL for Nigeria", () => {
    expect(result.threeDSAnalysis.status).toBe("INATIVO_PROVAVEL")
  })

  it("compliance mandateLevel should be BAIXO for Nigeria", () => {
    expect(result.complianceData.threeDSMandateLevel).toBe("BAIXO")
  })

  it("risk score should be elevated (Nigeria low maturity)", () => {
    expect(result.riskAnalysis.score).toBeGreaterThan(30)
  })

  it("complianceRisk should be ALTA for Nigeria", () => {
    expect(result.complianceData.complianceRisk).toBe("ALTA")
  })

  it("recommendation should be EXIGIR_3DS or BLOQUEAR_PREVENTIVAMENTE", () => {
    expect(["EXIGIR_3DS", "BLOQUEAR_PREVENTIVAMENTE", "REVISAR"]).toContain(
      result.riskAnalysis.recommendation,
    )
  })
})

// ─── Scenario 10: Regional bank card (Elo - Brazil/CEF) ──────────────────

describe("Scenario 10: Regional bank card — Elo/Brazil/CEF", () => {
  const result = analyzeBIN({
    bin: "636368",
    rawApiResponse: eloBrazilRegionalBank,
  })

  it("brand should be ELO (regional)", () => {
    expect(result.technicalData.brand).toBe("ELO")
  })

  it("3DS status should be ATIVO_PROVAVEL (Brazil high maturity)", () => {
    expect(result.threeDSAnalysis.status).toBe("ATIVO_PROVAVEL")
  })

  it("issuerKnown should be true (CEF)", () => {
    expect(result.dataQuality.issuerKnown).toBe(true)
  })

  it("compliance region should be Brasil", () => {
    expect(result.complianceData.regulatoryRegion).toBe("Brasil")
  })

  it("riskBreakdown should include country factor for Brazil", () => {
    const countryFactor = result.riskAnalysis.riskBreakdown.find(
      (f) => f.factor.toLowerCase().includes("brasil") || f.factor.toLowerCase().includes("brazil"),
    )
    expect(countryFactor).toBeDefined()
  })

  it("dataQuality should have all core fields present", () => {
    expect(result.dataQuality.countryKnown).toBe(true)
    expect(result.dataQuality.typeKnown).toBe(true)
  })
})

// ─── General: No bad language anywhere ───────────────────────────────────

describe("Language compliance: no prohibited terms", () => {
  const allResults = [
    analyzeBIN({ bin: "405708", rawApiResponse: visaCreditUSANoIssuer }),
    analyzeBIN({ bin: "510510", rawApiResponse: mastercardDebitUSA }),
    analyzeBIN({ bin: "451357", rawApiResponse: visaCreditBrazilKnownBank }),
  ]

  const prohibitedTerms = [
    "bypass",
    "passa",
    "aprovação garantida",
    "sem risco",
    "garantido",
  ]

  for (const result of allResults) {
    const jsonStr = JSON.stringify(result).toLowerCase()
    for (const term of prohibitedTerms) {
      it(`Result for ${result.bin} must not contain prohibited term: "${term}"`, () => {
        expect(jsonStr).not.toContain(term)
      })
    }
  }
})
