import { describe, expect, it } from "vitest"
import { formatGlossaryTerm, translateGlossaryText } from "../lib/premium-3-0/glossary"
import { buildWhyThisScore, groupRiskFactors } from "../lib/premium-3-0/presentation"
import type { FullBinAnalysis } from "../lib/premium-3-0/types"

const sampleAnalysis: FullBinAnalysis = {
  bin: "45661X",
  source: {
    provider: "INTERNAL",
    rawDataAvailable: true,
    apiConfidence: "HIGH",
  },
  technicalData: {
    bin: "45661X",
    binLength: 6,
    brand: "VISA",
    type: "CREDIT",
    category: "BUSINESS",
    countryCode: "GB",
    countryName: "United Kingdom",
    currency: "GBP",
    issuer: "Example Bank",
    isCommercial: true,
    isPrepaid: false,
    source: "INTERNAL",
  },
  threeDSAnalysis: {
    status: "LIKELY_ACTIVE",
    confidence: "HIGH",
    challengeLikelihood: "LOW",
    protocolLikely: "EMV_3DS_2_2",
    authMethodsLikely: ["APP_PUSH"],
    explanation: "PSD2 e SCA ajudam a reduzir fraude.",
    inferred: true,
  },
  riskAnalysis: {
    score: 5,
    level: "LOW",
    recommendation: "ALLOW_WITH_MONITORING",
    factors: [
      { label: "País com forte autenticação", impact: -10, reason: "PSD2 exige SCA" },
      { label: "BIN comercial", impact: 5, reason: "BIN comercial (PJ) requer contexto" },
    ],
  },
  dataQuality: {
    score: 90,
    level: "HIGH",
    missingFields: [],
    realApiFields: ["brand"],
    inferredFields: ["riskAnalysis"],
  },
  compliance: {
    regulatoryRegion: "EU",
    threeDSMandateLevel: "MANDATORY",
    regulationNote: "PSD2 com SCA obrigatória",
    complianceRisk: "LOW",
  },
  finalSummary: {
    title: "ALLOW_WITH_MONITORING",
    message: "Risco baixo com PSD2/SCA",
    action: "Aprovar",
  },
}

describe("analysis glossary + presentation helpers", () => {
  it("traduz recomendação para modo comerciante", () => {
    expect(formatGlossaryTerm("ALLOW_WITH_MONITORING", "merchant")).toBe("Aprovar e monitorar")
  })

  it("remove jargão cru no texto do modo comerciante", () => {
    const translated = translateGlossaryText("Regras PSD2 e SCA em ALLOW_WITH_MONITORING", "merchant")
    expect(translated).toContain("Regra europeia de pagamento seguro")
    expect(translated).toContain("Autenticação extra do banco")
    expect(translated).not.toContain("ALLOW_WITH_MONITORING")
  })

  it("gera explicação dinâmica de score", () => {
    const why = buildWhyThisScore(sampleAnalysis)
    expect(why).toContain("5/100")
    expect(why).toContain("45661X")
    expect(why.toLowerCase()).toContain("risco muito baixo")
  })

  it("agrupa fatores em favor e atenção", () => {
    const grouped = groupRiskFactors(sampleAnalysis.riskAnalysis.factors)
    expect(grouped.favorable).toHaveLength(1)
    expect(grouped.attention).toHaveLength(1)
  })
})
