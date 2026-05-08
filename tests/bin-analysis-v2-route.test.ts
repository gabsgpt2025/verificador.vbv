import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"
import type { BinApiData, FullBinAnalysis } from "@/lib/premium-3-0/types"

const {
  createClientMock,
  subtractCreditsMock,
  callNeutrinoApiMock,
  normalizeNeutrinoBinResponseMock,
  applyBinOverridesMock,
  runFullBinAnalysisMock,
  saveBinAnalysisLogMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  subtractCreditsMock: vi.fn(),
  callNeutrinoApiMock: vi.fn(),
  normalizeNeutrinoBinResponseMock: vi.fn(),
  applyBinOverridesMock: vi.fn(),
  runFullBinAnalysisMock: vi.fn(),
  saveBinAnalysisLogMock: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}))

vi.mock("@/lib/credits/operations", () => ({
  subtractCredits: subtractCreditsMock,
}))

vi.mock("@/lib/premium-3-0/neutrino-api", () => ({
  callNeutrinoApi: callNeutrinoApiMock,
}))

vi.mock("@/lib/premium-3-0/normalizeBinApiResponse", () => ({
  normalizeNeutrinoBinResponse: normalizeNeutrinoBinResponseMock,
}))

vi.mock("@/lib/premium-3-0/applyBinOverrides", () => ({
  applyBinOverrides: applyBinOverridesMock,
}))

vi.mock("@/lib/premium-3-0", () => ({
  runFullBinAnalysis: runFullBinAnalysisMock,
}))

vi.mock("@/lib/premium-3-0/saveBinAnalysisLog", () => ({
  saveBinAnalysisLog: saveBinAnalysisLogMock,
}))

import { POST } from "@/app/api/bin-analysis-v2/route"

describe("/api/bin-analysis-v2 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
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
        explanation: "ok",
        inferred: true,
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

    callNeutrinoApiMock.mockResolvedValue({ card_brand: "VISA" })
    normalizeNeutrinoBinResponseMock.mockReturnValue(normalizedBinData)
    applyBinOverridesMock.mockResolvedValue({ data: normalizedBinData })
    runFullBinAnalysisMock.mockReturnValue(fullAnalysis)
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

    expect(response.status).toBe(200)
    expect(callNeutrinoApiMock).toHaveBeenCalledTimes(1)
    expect(subtractCreditsMock).toHaveBeenCalledTimes(1)

    const neutrinoCallOrder = callNeutrinoApiMock.mock.invocationCallOrder[0]
    const debitCallOrder = subtractCreditsMock.mock.invocationCallOrder[0]
    expect(debitCallOrder).toBeGreaterThan(neutrinoCallOrder)
  })

  it("retorna 502 estruturado e não debita quando upstream falha", async () => {
    callNeutrinoApiMock.mockRejectedValue(new Error("Neutrino API error: 502 - temporary error"))

    const request = new Request("http://localhost/api/bin-analysis-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bin: "411111" }),
    }) as NextRequest

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload.ok).toBe(false)
    expect(payload.error.code).toBe("UPSTREAM_NEUTRINO_FAILURE")
    expect(typeof payload.error.requestId).toBe("string")
    expect(subtractCreditsMock).not.toHaveBeenCalled()
  })
})
