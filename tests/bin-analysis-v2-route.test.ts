import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"
import type { MastercardBinResult } from "@/lib/integrations/mastercard"
import type { BinApiData, FullBinAnalysis } from "@/lib/premium-3-0/types"

const {
  createClientMock,
  subtractCreditsMock,
  lookupBinMultiSourceMock,
  applyBinOverridesMock,
  runFullBinAnalysisMock,
  runHolisticAnalysisMock,
  computePeerComparisonMock,
  saveBinAnalysisLogMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  subtractCreditsMock: vi.fn(),
  lookupBinMultiSourceMock: vi.fn(),
  applyBinOverridesMock: vi.fn(),
  runFullBinAnalysisMock: vi.fn(),
  runHolisticAnalysisMock: vi.fn(),
  computePeerComparisonMock: vi.fn(),
  saveBinAnalysisLogMock: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}))

vi.mock("@/lib/credits/operations", () => ({
  subtractCredits: subtractCreditsMock,
}))

vi.mock("@/lib/premium-3-0/multiSourceLookup", () => ({
  lookupBinMultiSource: lookupBinMultiSourceMock,
}))

vi.mock("@/lib/premium-3-0/applyBinOverrides", () => ({
  applyBinOverrides: applyBinOverridesMock,
}))

vi.mock("@/lib/premium-3-0", () => ({
  runFullBinAnalysis: runFullBinAnalysisMock,
  runHolisticAnalysis: runHolisticAnalysisMock,
}))

vi.mock("@/lib/premium-3-0/saveBinAnalysisLog", () => ({
  saveBinAnalysisLog: saveBinAnalysisLogMock,
}))

vi.mock("@/lib/premium-3-0/peerComparison", () => ({
  computePeerComparison: computePeerComparisonMock,
}))

vi.mock("@/lib/premium-3-0/services/exchangeRateService", () => ({
  getExchangeRates: vi.fn().mockResolvedValue({
    base: "USD",
    rates: { USD: 1, EUR: 0.92, BRL: 5.65, GBP: 0.79 },
    source: "CACHE",
    lastUpdated: "2026-05-09T00:00:00Z",
  }),
}))

import { POST } from "@/app/api/bin-analysis-v2/route"

describe("/api/bin-analysis-v2 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const historyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn().mockReturnValue(historyQuery),
    })

    const normalizedBinData: BinApiData = {
      bin: "411111",
      binLength: 6,
      brand: "VISA",
      source: "NEUTRINO",
    }

    const fullAnalysis: FullBinAnalysis = {
      bin: "411111",
      source: {
        provider: "NEUTRINO",
        rawDataAvailable: true,
        apiConfidence: "HIGH",
      },
      technicalData: normalizedBinData,
      threeDSAnalysis: {
        status: "LIKELY_ACTIVE",
        confidence: "HIGH",
        challengeLikelihood: "LOW",
        protocolLikely: "EMV_3DS_2_2",
        authMethodsLikely: [],
        explanation: {
          technical: "ok",
          popular: "ok",
        },
        inferred: true,
        frictionlessProbability: 88,
        challengeProbability: 12,
        bypassProbability: 72,
        applicableBypassMechanisms: ["FRICTIONLESS_3DS2"],
      },
      riskAnalysis: {
        score: 10,
        level: "LOW",
        recommendation: "ALLOW_WITH_MONITORING",
        factors: [],
      },
      dataQuality: {
        score: 100,
        level: "HIGH",
        missingFields: [],
        realApiFields: [],
        inferredFields: [],
      },
      compliance: {
        regulatoryRegion: "GLOBAL",
        threeDSMandateLevel: "MODERATE",
        regulationNote: "ok",
        complianceRisk: "LOW",
      },
      finalSummary: {
        title: "ok",
        message: "ok",
        action: "ok",
      },
    }

    const mastercardData: MastercardBinResult = {
      bin: "411111",
      binLength: 6,
      brand: "UNKNOWN",
      productCode: "",
      productName: "",
      productCategory: "CONSUMER",
      cardType: "CREDIT",
      countryCode: "",
      countryName: "",
      issuerName: "",
      issuerCountry: "",
      acceptanceBrand: "",
      source: "MASTERCARD",
      raw: null,
    }

    lookupBinMultiSourceMock.mockResolvedValue({
      primary: normalizedBinData,
      sources: {
        neutrino: normalizedBinData,
        mastercard: mastercardData,
      },
      consensus: {
        countryAgreement: true,
        brandAgreement: true,
        typeAgreement: true,
        confidence: "HIGH",
        discrepancies: [],
      },
    })
    applyBinOverridesMock.mockResolvedValue({ data: normalizedBinData })
    runFullBinAnalysisMock.mockReturnValue(fullAnalysis)
    runHolisticAnalysisMock.mockReturnValue({
      binRisk: { score: 10, factors: [] },
      temporalRisk: { score: 10, factors: [] },
      behavioralRisk: { score: 40, factors: [] },
      geographicRisk: { score: 5, factors: [] },
      deviceRisk: { score: 15, factors: [] },
        gatewayRisk: { score: 20, factors: [] },
        overallScore: 15,
        riskLevel: "LOW",
        peerComparison: { percentile: 90, description: "Melhor que 90%." },
        recommendation: "APPROVE",
        ensembleConfidence: 100,
      })
    computePeerComparisonMock.mockResolvedValue({
      percentile: 90,
      peerCount: 42,
      betterThan: 90,
      peerGroup: "VISA-BR-CREDIT",
      dataSource: "HEURISTIC_ESTIMATE",
    })
    saveBinAnalysisLogMock.mockResolvedValue(undefined)
    subtractCreditsMock.mockResolvedValue({ success: true, message: "ok", newBalance: 7 })
  })

  it("debita crédito somente após sucesso da Neutrino", async () => {
    const request = new Request("http://localhost/api/bin-analysis-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bin: "411111" }),
    }) as NextRequest

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(lookupBinMultiSourceMock).toHaveBeenCalledTimes(1)
    expect(runHolisticAnalysisMock).toHaveBeenCalledTimes(1)
    expect(subtractCreditsMock).toHaveBeenCalledTimes(1)
    expect(payload.holistic.overallScore).toBe(15)
    expect(payload.context.userAgentPresent).toBe(false)
    expect(payload.sources.neutrino.available).toBe(true)
    expect(payload.consensus.confidence).toBe("HIGH")

    const neutrinoCallOrder = lookupBinMultiSourceMock.mock.invocationCallOrder[0]
    const debitCallOrder = subtractCreditsMock.mock.invocationCallOrder[0]
    expect(debitCallOrder).toBeGreaterThan(neutrinoCallOrder)
  })

  it("retorna 502 estruturado e não debita quando upstream falha", async () => {
    lookupBinMultiSourceMock.mockRejectedValue(new Error("Bin lookup failed"))

    const request = new Request("http://localhost/api/bin-analysis-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bin: "411111" }),
    }) as NextRequest

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload.ok).toBe(false)
    expect(payload.error.code).toBe("UPSTREAM_BIN_LOOKUP_FAILURE")
    expect(typeof payload.error.requestId).toBe("string")
    expect(subtractCreditsMock).not.toHaveBeenCalled()
  })

  it("retorna 500 estruturado e não debita quando falha ao salvar o histórico", async () => {
    saveBinAnalysisLogMock.mockRejectedValue(new Error("insert failed"))

    const request = new Request("http://localhost/api/bin-analysis-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bin: "411111" }),
    }) as NextRequest

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.ok).toBe(false)
    expect(payload.error.code).toBe("BIN_ANALYSIS_LOG_INSERT_FAILED")
    expect(subtractCreditsMock).not.toHaveBeenCalled()
  })
})
