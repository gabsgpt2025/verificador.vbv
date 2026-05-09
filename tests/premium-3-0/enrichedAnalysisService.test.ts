import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock all external dependencies
vi.mock("@/lib/env", () => ({
  getEnv: vi.fn().mockReturnValue({
    NEUTRINO_IP_INFO_ENABLED: true,
    NEUTRINO_IP_BLOCKLIST_ENABLED: true,
    NEUTRINO_IP_PROBE_ENABLED: true,
    NEUTRINO_UA_LOOKUP_ENABLED: true,
    NEUTRINO_HOST_REPUTATION_ENABLED: true,
  }),
}))

vi.mock("@/lib/premium-3-0/sessionRisk", () => ({
  analyzeSessionRisk: vi.fn().mockResolvedValue({
    ip: "1.2.3.4",
    ipMasked: "1.x.x.4",
    geo: { country: "BR", city: "São Paulo", isp: "Vivo", asn: null, hostname: null },
    network: {
      isTor: false, isProxy: false, isVpn: false, isHijacked: false,
      isSpider: false, isMalware: false, isBot: false, isListed: false, blocklistCount: 0,
    },
    device: {
      browser: "Chrome", browserVersion: "120", os: "Windows", osVersion: "10",
      deviceType: "DESKTOP", isMobile: false, isBot: false,
    },
    hostReputation: null,
    client: { fingerprint: null, timezone: null, languages: [], screen: null },
    riskScore: 20,
    riskLevel: "LOW",
    recommendation: "ALLOW",
    factors: [],
    sourcesUsed: ["neutrino:ip-info"],
    generatedAt: new Date().toISOString(),
  }),
}))

vi.mock("@/lib/premium-3-0/neutrino/ipProbe", () => ({
  fetchIpProbeDetailed: vi.fn().mockResolvedValue({
    data: {
      ip: "1.2.3.4",
      valid: true,
      is_vpn: false,
      is_proxy: false,
      is_hosting: false,
    },
    meta: { endpoint: "ip-probe", status: 200, durationMs: 100, cached: false, breakerState: "CLOSED", networkSuccess: true },
  }),
}))

vi.mock("@/lib/integrations/fraudlabs", () => ({
  screenOrderFraudLabs: vi.fn().mockResolvedValue({
    fraudScore: 15,
    status: "APPROVE",
    ipCountry: "BR",
    ipIsp: "Vivo",
    isProxy: false,
    isCountryMatch: true,
    isIpBlacklisted: false,
    isHighRiskCountry: false,
    isBinFound: true,
    isBinPrepaid: false,
    binCountry: "BR",
    binIssuer: "Itau",
    creditsRemaining: 490,
    queriedAt: new Date().toISOString(),
    raw: {},
  }),
  isFraudLabsEnabled: vi.fn().mockReturnValue(true),
}))

vi.mock("@/lib/integrations/mastercard", () => ({
  fetchMastercardIdentityInsights: vi.fn().mockResolvedValue(null),
  fetchMastercardFraudScore: vi.fn().mockResolvedValue(null),
  isMastercardEnhancedEnabled: vi.fn().mockReturnValue(false),
}))

import { runEnrichedAnalysis } from "@/lib/premium-3-0/services/enrichedAnalysisService"

describe("Enriched Analysis Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should run all APIs and return consolidated result", async () => {
    const result = await runEnrichedAnalysis({
      bin: "411111",
      ip: "1.2.3.4",
      userAgent: "Mozilla/5.0",
      amount: 500,
      currency: "BRL",
    })

    expect(result).toBeDefined()
    expect(result.sessionRisk).not.toBeNull()
    expect(result.sessionRisk!.riskScore).toBe(20)
    expect(result.fraudLabs).not.toBeNull()
    expect(result.fraudLabs!.fraudScore).toBe(15)
    expect(result.ipProbe).not.toBeNull()
    expect(result.mastercardIdentity).toBeNull()
    expect(result.mastercardFraud).toBeNull()
    expect(result.dataProvenance).toBeDefined()
    expect(result.dataProvenance.overallConfidence).toBe("HIGH") // 3+ APIs succeeded
    expect(result.apiDiagnostics.length).toBeGreaterThan(0)
  })

  it("should handle missing IP gracefully", async () => {
    const result = await runEnrichedAnalysis({
      bin: "411111",
      amount: 500,
      currency: "BRL",
    })

    expect(result.sessionRisk).toBeNull()
    expect(result.ipProbe).toBeNull()
    // FraudLabs should still work without IP
    expect(result.fraudLabs).not.toBeNull()
    expect(result.apiDiagnostics.some(d => d.api === "neutrino:session-risk" && d.status === "skipped")).toBe(true)
  })

  it("should include data provenance with correct sources", async () => {
    const result = await runEnrichedAnalysis({
      bin: "411111",
      ip: "1.2.3.4",
      userAgent: "Mozilla/5.0",
    })

    expect(result.dataProvenance.sessionRisk).toBe("NEUTRINO_SESSION_RISK")
    expect(result.dataProvenance.fraudScoring).toBe("FRAUDLABS_PRO")
    expect(result.dataProvenance.ipProbe).toBe("NEUTRINO_IP_PROBE")
  })

  it("should have correct diagnostic statuses", async () => {
    const result = await runEnrichedAnalysis({
      bin: "411111",
      ip: "1.2.3.4",
    })

    const sessionDiag = result.apiDiagnostics.find(d => d.api === "neutrino:session-risk")
    const fraudDiag = result.apiDiagnostics.find(d => d.api === "fraudlabs-pro")
    const mcIdentityDiag = result.apiDiagnostics.find(d => d.api === "mastercard:identity")

    expect(sessionDiag?.status).toBe("success")
    expect(fraudDiag?.status).toBe("success")
    expect(mcIdentityDiag?.status).toBe("disabled")
  })
})
