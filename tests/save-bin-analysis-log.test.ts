import { describe, expect, it, vi } from "vitest"
import { saveBinAnalysisLog } from "@/lib/premium-3-0/saveBinAnalysisLog"
import type { FullBinAnalysis } from "@/lib/premium-3-0/types"

describe("saveBinAnalysisLog", () => {
  it("persiste risk_level e result no histórico", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert,
      }),
    }

    const analysis: FullBinAnalysis = {
      bin: "41111111",
      source: {
        provider: "NEUTRINO",
        rawDataAvailable: true,
        apiConfidence: "HIGH",
      },
      technicalData: {
        bin: "41111111",
        binLength: 8,
        brand: "VISA",
        type: "CREDIT",
        category: "PLATINUM",
        countryCode: "BR",
        countryName: "Brazil",
        issuer: "Banco Teste",
        source: "NEUTRINO",
      },
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
        score: 18,
        level: "LOW",
        recommendation: "ALLOW_WITH_MONITORING",
        factors: [],
      },
      dataQuality: {
        score: 92,
        level: "HIGH",
        missingFields: [],
        realApiFields: [],
        inferredFields: [],
      },
      compliance: {
        regulatoryRegion: "LATAM",
        threeDSMandateLevel: "STRONG",
        regulationNote: "ok",
        complianceRisk: "LOW",
      },
      finalSummary: {
        title: "ok",
        message: "ok",
        action: "ok",
      },
    }

    await saveBinAnalysisLog(supabase, "user-1", analysis)

    expect(supabase.from).toHaveBeenCalledWith("bin_analysis_logs")
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        bin: "41111111",
        bin8: "41111111",
        risk_score: 18,
        risk_level: "LOW",
        data_quality_score: 92,
        result: analysis,
      }),
    )
  })
})
