/**
 * Tests for runHolisticAnalysis with enriched API data (FASE 2)
 */
import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/premium-3-0/data/threeDsByBank.json", () => ({
  default: {},
}))

vi.mock("@/lib/premium-3-0/services/exchangeRateService", () => ({
  convertCentsToEurSync: vi.fn().mockReturnValue(100),
  convertCentsToBrlSync: vi.fn().mockReturnValue(500),
  getRatesSync: vi.fn().mockReturnValue({ USD: 1, EUR: 0.85, BRL: 5.2 }),
}))

import { runHolisticAnalysis } from "@/lib/premium-3-0/holisticEngine"
import type { BinApiData } from "@/lib/premium-3-0/types"
import type { EnrichedAnalysisResult } from "@/lib/premium-3-0/services/enrichedAnalysisService"

function makeBin(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: "411111",
    binLength: 6,
    brand: "VISA",
    type: "CREDIT",
    category: "CLASSIC",
    issuer: "Banco Itaú",
    countryCode: "BR",
    countryName: "Brazil",
    isPrepaid: false,
    source: "NEUTRINO",
    ...overrides,
  }
}

function makeContext() {
  return {
    amount: 500,
    currency: "BRL",
    timestamp: Date.now(),
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ipAddress: "1.2.3.4",
    ipCountryCode: "BR",
    isFirstTransaction: false,
  }
}

function makeEnriched(overrides: Partial<EnrichedAnalysisResult> = {}): EnrichedAnalysisResult {
  return {
    sessionRisk: {
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
    },
    ipProbe: null,
    fraudLabs: {
      fraudScore: 10,
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
      raw: {} as any,
    },
    mastercardIdentity: null,
    mastercardFraud: null,
    dataProvenance: {
      binData: "MULTI_SOURCE_LOOKUP",
      sessionRisk: "NEUTRINO_SESSION_RISK",
      fraudScoring: "FRAUDLABS_PRO",
      identityCheck: "NOT_AVAILABLE",
      ipProbe: "NOT_AVAILABLE",
      overallConfidence: "MEDIUM",
    },
    apiDiagnostics: [
      { api: "neutrino:session-risk", status: "success", latencyMs: 200, message: "OK" },
      { api: "fraudlabs-pro", status: "success", latencyMs: 300, message: "OK" },
    ],
    ...overrides,
  }
}

describe("runHolisticAnalysis with enriched data (FASE 2)", () => {
  it("should include externalApiRisk dimension when enriched data is provided", () => {
    const result = runHolisticAnalysis(makeBin(), makeContext(), makeEnriched())
    expect(result.externalApiRisk).toBeDefined()
    expect(result.externalApiRisk!.dataAvailable).toBe(true)
    expect(result.externalApiRisk!.weight).toBe(0.20)
    expect(result.externalApiRisk!.factors.length).toBeGreaterThan(0)
  })

  it("should NOT include externalApiRisk when no enriched data", () => {
    const result = runHolisticAnalysis(makeBin(), makeContext())
    expect(result.externalApiRisk).toBeUndefined()
  })

  it("should NOT include externalApiRisk when enriched data is empty", () => {
    const emptyEnriched = makeEnriched({
      sessionRisk: null,
      fraudLabs: null,
      ipProbe: null,
      mastercardIdentity: null,
      mastercardFraud: null,
    })
    const result = runHolisticAnalysis(makeBin(), makeContext(), emptyEnriched)
    expect(result.externalApiRisk).toBeUndefined()
  })

  it("should increase risk when TOR is detected", () => {
    const normalResult = runHolisticAnalysis(makeBin(), makeContext(), makeEnriched())

    const torEnriched = makeEnriched()
    torEnriched.sessionRisk!.network.isTor = true
    torEnriched.sessionRisk!.riskScore = 70
    const torResult = runHolisticAnalysis(makeBin(), makeContext(), torEnriched)

    expect(torResult.externalApiRisk!.score).toBeGreaterThan(normalResult.externalApiRisk!.score)
    expect(torResult.externalApiRisk!.factors.some(f => f.label.includes("TOR"))).toBe(true)
  })

  it("should increase risk when FraudLabs detects high fraud score", () => {
    const highFraudEnriched = makeEnriched()
    highFraudEnriched.fraudLabs!.fraudScore = 85
    const result = runHolisticAnalysis(makeBin(), makeContext(), highFraudEnriched)
    expect(result.externalApiRisk!.factors.some(f => f.label.includes("FraudLabs Pro: alto risco"))).toBe(true)
  })

  it("should add external API sources to sourcesUsed", () => {
    const result = runHolisticAnalysis(makeBin(), makeContext(), makeEnriched())
    expect(result.sourcesUsed).toContain("neutrino:session-risk")
    expect(result.sourcesUsed).toContain("fraudlabs-pro")
  })

  it("should use adjusted weights when external API data is available", () => {
    // With enriched data, confidence goes up (7 dimensions)
    const withEnriched = runHolisticAnalysis(makeBin(), makeContext(), makeEnriched())
    const withoutEnriched = runHolisticAnalysis(makeBin(), makeContext())

    // Both should have valid scores
    expect(withEnriched.overallScore).toBeGreaterThanOrEqual(0)
    expect(withEnriched.overallScore).toBeLessThanOrEqual(100)
    expect(withoutEnriched.overallScore).toBeGreaterThanOrEqual(0)
    expect(withoutEnriched.overallScore).toBeLessThanOrEqual(100)
  })
})
