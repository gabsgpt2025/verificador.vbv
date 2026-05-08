import { afterEach, describe, expect, it, vi } from "vitest"
import { analyzeSessionRisk, maskIp } from "@/lib/premium-3-0/sessionRisk"

// ============================================================================
// Mocks
// ============================================================================

const {
  fetchIpInfoDetailedMock,
  fetchIpBlocklistDetailedMock,
  fetchUaLookupDetailedMock,
  fetchHostReputationDetailedMock,
  getEnvMock,
} = vi.hoisted(() => ({
  fetchIpInfoDetailedMock: vi.fn(),
  fetchIpBlocklistDetailedMock: vi.fn(),
  fetchUaLookupDetailedMock: vi.fn(),
  fetchHostReputationDetailedMock: vi.fn(),
  getEnvMock: vi.fn(),
}))

vi.mock("@/lib/premium-3-0/neutrino/ipInfo", () => ({
  fetchIpInfoDetailed: fetchIpInfoDetailedMock,
}))

vi.mock("@/lib/premium-3-0/neutrino/ipBlocklist", () => ({
  fetchIpBlocklistDetailed: fetchIpBlocklistDetailedMock,
}))

vi.mock("@/lib/premium-3-0/neutrino/uaLookup", () => ({
  fetchUaLookupDetailed: fetchUaLookupDetailedMock,
}))

vi.mock("@/lib/premium-3-0/neutrino/hostReputation", () => ({
  fetchHostReputationDetailed: fetchHostReputationDetailedMock,
}))

// Mock lib/env to avoid module-level caching side effects
vi.mock("@/lib/env", () => ({
  getEnv: getEnvMock,
  getNeutrinoCredentials: vi.fn().mockReturnValue({ apiKey: "key", userId: "uid" }),
}))

// ============================================================================
// Helpers
// ============================================================================

type EnvFlags = {
  ipInfo?: boolean
  ipBlocklist?: boolean
  uaLookup?: boolean
  hostReputation?: boolean
}

function setEnvFlags(flags: EnvFlags = {}) {
  getEnvMock.mockReturnValue({
    NEUTRINO_IP_INFO_ENABLED: flags.ipInfo ?? false,
    NEUTRINO_IP_BLOCKLIST_ENABLED: flags.ipBlocklist ?? false,
    NEUTRINO_UA_LOOKUP_ENABLED: flags.uaLookup ?? false,
    NEUTRINO_HOST_REPUTATION_ENABLED: flags.hostReputation ?? false,
  })
}

// ============================================================================
// maskIp unit tests
// ============================================================================

describe("maskIp", () => {
  it("masks middle two octets of IPv4", () => {
    expect(maskIp("201.45.67.42")).toBe("201.x.x.42")
    expect(maskIp("192.168.1.100")).toBe("192.x.x.100")
  })

  it("masks middle groups of IPv6", () => {
    const masked = maskIp("2001:db8:85a3:0:0:8a2e:370:7334")
    expect(masked).toMatch(/^2001:x:/)
    expect(masked).toMatch(/:7334$/)
  })

  it("handles non-standard IPs without throwing", () => {
    expect(() => maskIp("unknown")).not.toThrow()
  })
})

// ============================================================================
// analyzeSessionRisk — score determinism
// ============================================================================

describe("analyzeSessionRisk score determinism", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("VPN + TOR + bot UA → score ≥ 85, recomendação BLOCK", async () => {
    setEnvFlags({ ipInfo: true, ipBlocklist: true, uaLookup: true })

    fetchIpInfoDetailedMock.mockResolvedValue({
      data: { country_code: "XX", city: "Unknown", provider: "AnonymousCo", is_vpn: true, is_tor: true, is_proxy: false },
      meta: { networkSuccess: true, cached: false },
    })

    fetchIpBlocklistDetailedMock.mockResolvedValue({
      data: { is_listed: true, list_count: 3, is_vpn: true, is_tor: true, is_proxy: false, is_hijacked: false, is_malware: false, is_bot: false, is_spider: false },
      meta: { networkSuccess: true, cached: false },
    })

    fetchUaLookupDetailedMock.mockResolvedValue({
      data: { type: "BOT", browser: null, browser_version: null, os: null, os_version: null, is_mobile: false, is_bot: true },
      meta: { networkSuccess: true, cached: false },
    })

    const result = await analyzeSessionRisk({
      ip: "1.2.3.4",
      userAgent: "HeadlessChrome/120 (bot)",
    })

    expect(result.riskScore).toBeGreaterThanOrEqual(85)
    expect(result.recommendation).toBe("BLOCK")
    expect(result.riskLevel).toBe("CRITICAL")
    expect(result.network.isVpn).toBe(true)
    expect(result.network.isTor).toBe(true)
    expect(result.device.isBot).toBe(true)
    expect(result.sourcesUsed).toContain("neutrino:ip-info")
    expect(result.sourcesUsed).toContain("neutrino:ip-blocklist")
    expect(result.sourcesUsed).toContain("neutrino:ua-lookup")
  })

  it("Mobile residencial BR + sem flags → score ≤ 25, recomendação ALLOW", async () => {
    setEnvFlags({ ipInfo: true, ipBlocklist: true, uaLookup: true })

    fetchIpInfoDetailedMock.mockResolvedValue({
      data: { country_code: "BR", city: "São Paulo", provider: "Claro Brasil", is_vpn: false, is_tor: false, is_proxy: false },
      meta: { networkSuccess: true, cached: false },
    })

    fetchIpBlocklistDetailedMock.mockResolvedValue({
      data: { is_listed: false, list_count: 0, is_vpn: false, is_tor: false, is_proxy: false, is_hijacked: false, is_malware: false, is_bot: false, is_spider: false },
      meta: { networkSuccess: true, cached: false },
    })

    fetchUaLookupDetailedMock.mockResolvedValue({
      data: { type: "MOBILE-BROWSER", browser: "Chrome Mobile", browser_version: "120.0", os: "Android", os_version: "14", is_mobile: true, is_bot: false },
      meta: { networkSuccess: true, cached: false },
    })

    const result = await analyzeSessionRisk({
      ip: "179.34.5.100",
      userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36",
    })

    expect(result.riskScore).toBeLessThanOrEqual(25)
    expect(result.recommendation).toBe("ALLOW")
    expect(result.riskLevel).toBe("LOW")
    expect(result.network.isVpn).toBe(false)
    expect(result.network.isTor).toBe(false)
    expect(result.device.isMobile).toBe(true)
    expect(result.device.isBot).toBe(false)
  })

  it("VPN sozinho → score 40–60, recomendação CHALLENGE ou REVIEW", async () => {
    setEnvFlags({ ipInfo: true, ipBlocklist: true, uaLookup: true })

    fetchIpInfoDetailedMock.mockResolvedValue({
      data: { country_code: "US", city: "New York", provider: "ExpressVPN", is_vpn: true, is_tor: false, is_proxy: false },
      meta: { networkSuccess: true, cached: false },
    })

    fetchIpBlocklistDetailedMock.mockResolvedValue({
      data: { is_listed: false, list_count: 0, is_vpn: true, is_tor: false, is_proxy: false, is_hijacked: false, is_malware: false, is_bot: false, is_spider: false },
      meta: { networkSuccess: true, cached: false },
    })

    fetchUaLookupDetailedMock.mockResolvedValue({
      data: { type: "DESKTOP-BROWSER", browser: "Chrome", browser_version: "120.0", os: "Windows", os_version: "10", is_mobile: false, is_bot: false },
      meta: { networkSuccess: true, cached: false },
    })

    const result = await analyzeSessionRisk({
      ip: "5.5.5.5",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
    })

    expect(result.riskScore).toBeGreaterThanOrEqual(40)
    expect(result.riskScore).toBeLessThanOrEqual(60)
    expect(["CHALLENGE", "REVIEW"]).toContain(result.recommendation)
    expect(result.network.isVpn).toBe(true)
    expect(result.network.isTor).toBe(false)
  })

  it("all flags disabled → fallback to local UA parser, sourcesUsed contains local:ua-parser", async () => {
    setEnvFlags() // all flags false

    const result = await analyzeSessionRisk({
      ip: "10.0.0.1",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148",
    })

    // No network enrichment — base score only modified by mobile reduction
    expect(result.riskScore).toBeLessThanOrEqual(30)
    expect(result.sourcesUsed).toContain("local:ua-parser")
    expect(result.sourcesUsed).not.toContain("neutrino:ip-info")
  })

  it("gracefully handles Neutrino failure — returns result without throwing", async () => {
    setEnvFlags({ ipInfo: true, ipBlocklist: true })

    fetchIpInfoDetailedMock.mockRejectedValue(new Error("Network timeout"))
    fetchIpBlocklistDetailedMock.mockRejectedValue(new Error("Network timeout"))

    const result = await analyzeSessionRisk({
      ip: "1.1.1.1",
      userAgent: "Mozilla/5.0",
    })

    // Should not throw; network flags all false (no data)
    expect(result).toBeDefined()
    expect(result.network.isTor).toBe(false)
    expect(result.network.isVpn).toBe(false)
    expect(result.sourcesUsed).not.toContain("neutrino:ip-info")
  })

  it("null IP → ipMasked is x.x.x.x", async () => {
    setEnvFlags()

    const result = await analyzeSessionRisk({ ip: null, userAgent: null })

    expect(result.ip).toBeNull()
    expect(result.ipMasked).toBe("x.x.x.x")
  })

  it("includes client signals in response", async () => {
    setEnvFlags()

    const result = await analyzeSessionRisk({
      ip: null,
      userAgent: null,
      client: {
        fingerprint: "abc123",
        timezone: "America/Sao_Paulo",
        languages: ["pt-BR", "en"],
        screen: { w: 1920, h: 1080, colorDepth: 24 },
      },
    })

    expect(result.client.fingerprint).toBe("abc123")
    expect(result.client.timezone).toBe("America/Sao_Paulo")
    expect(result.client.languages).toEqual(["pt-BR", "en"])
    expect(result.client.screen).toEqual({ w: 1920, h: 1080, colorDepth: 24 })
  })

  it("generatedAt is a valid ISO 8601 date string", async () => {
    setEnvFlags()

    const result = await analyzeSessionRisk({ ip: null, userAgent: null })

    expect(() => new Date(result.generatedAt)).not.toThrow()
    expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt)
  })
})
