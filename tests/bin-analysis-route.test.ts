import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const {
  mockGetUser,
  mockSubtractCredits,
  mockNormalizeBinApiResponse,
  mockApplyBinOverrides,
  mockRunFullBinAnalysis,
  mockSaveBinAnalysisLog,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSubtractCredits: vi.fn(),
  mockNormalizeBinApiResponse: vi.fn(),
  mockApplyBinOverrides: vi.fn(),
  mockRunFullBinAnalysis: vi.fn(),
  mockSaveBinAnalysisLog: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

vi.mock("@/lib/credits/operations", () => ({
  subtractCredits: mockSubtractCredits,
}))

vi.mock("@/lib/premium-3-0/normalizeBinApiResponse", () => ({
  normalizeBinApiResponse: mockNormalizeBinApiResponse,
}))

vi.mock("@/lib/premium-3-0/applyBinOverrides", () => ({
  applyBinOverrides: mockApplyBinOverrides,
}))

vi.mock("@/lib/premium-3-0", () => ({
  runFullBinAnalysis: mockRunFullBinAnalysis,
}))

vi.mock("@/lib/premium-3-0/saveBinAnalysisLog", () => ({
  saveBinAnalysisLog: mockSaveBinAnalysisLog,
}))

import { POST } from "../app/api/bin-analysis/route"

describe("/api/bin-analysis route", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockNormalizeBinApiResponse.mockReturnValue({ bin: "405708", source: "BINLIST", binLength: 6 })
    mockApplyBinOverrides.mockResolvedValue({ data: { bin: "405708", source: "BINLIST", binLength: 6 } })
    mockRunFullBinAnalysis.mockReturnValue({ bin: "405708", riskAnalysis: { score: 12 } })
    mockSaveBinAnalysisLog.mockResolvedValue(undefined)
    mockSubtractCredits.mockResolvedValue({ success: true })

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            scheme: "visa",
            type: "credit",
            country: { alpha2: "US", name: "United States" },
            bank: { name: "Test Bank" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    )
  })

  it("uses canonical runFullBinAnalysis flow for guest requests", async () => {
    const req = new NextRequest("http://localhost/api/bin-analysis", {
      method: "POST",
      body: JSON.stringify({ bin: "405708" }),
      headers: { "content-type": "application/json" },
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockNormalizeBinApiResponse).toHaveBeenCalledWith("BINLIST", expect.any(Object), "405708")
    expect(mockRunFullBinAnalysis).toHaveBeenCalledTimes(1)
    expect(body).toEqual({ bin: "405708", riskAnalysis: { score: 12 } })
    expect(mockSubtractCredits).not.toHaveBeenCalled()
    expect(mockSaveBinAnalysisLog).not.toHaveBeenCalled()
  })

  it("applies overrides, charges credits, and logs when user is authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })
    mockApplyBinOverrides.mockResolvedValueOnce({ data: { bin: "40570812", source: "BINLIST", binLength: 8 } })
    mockRunFullBinAnalysis.mockReturnValueOnce({ bin: "40570812", riskAnalysis: { score: 20 } })

    const req = new NextRequest("http://localhost/api/bin-analysis", {
      method: "POST",
      body: JSON.stringify({ bin: "4057081234" }),
      headers: { "content-type": "application/json" },
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockSubtractCredits).toHaveBeenCalledWith(
      "user-1",
      3,
      "VeriFiBIN 2.0 — Análise Antifraude (BIN: 4057081234)",
    )
    expect(mockApplyBinOverrides).toHaveBeenCalledTimes(1)
    expect(mockRunFullBinAnalysis).toHaveBeenCalledWith({ bin: "40570812", source: "BINLIST", binLength: 8 })
    expect(mockSaveBinAnalysisLog).toHaveBeenCalledWith(expect.any(Object), "user-1", {
      bin: "40570812",
      riskAnalysis: { score: 20 },
    })
    expect(body).toEqual({ bin: "40570812", riskAnalysis: { score: 20 } })
  })
})
