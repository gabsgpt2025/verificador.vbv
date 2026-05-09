import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock do cache
vi.mock("@/lib/premium-3-0/runtime/cache", () => ({
  getCache: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  }),
}))

// Mock do oauthSigner
vi.mock("@/lib/integrations/mastercard/oauthSigner", () => ({
  loadPrivateKeyFromEnv: vi.fn(),
  signRequest: vi.fn().mockReturnValue({ authorizationHeader: "OAuth test" }),
}))

import { loadPrivateKeyFromEnv } from "@/lib/integrations/mastercard/oauthSigner"

describe("Mastercard Enhanced Services", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it("isMastercardEnhancedEnabled returns false without credentials", async () => {
    vi.mocked(loadPrivateKeyFromEnv).mockReturnValue(null)
    delete process.env.MASTERCARD_CONSUMER_KEY
    const { isMastercardEnhancedEnabled } = await import("@/lib/integrations/mastercard/enhancedServices")
    expect(isMastercardEnhancedEnabled()).toBe(false)
  })

  it("isMastercardEnhancedEnabled returns true with credentials", async () => {
    vi.mocked(loadPrivateKeyFromEnv).mockReturnValue("-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----")
    process.env.MASTERCARD_CONSUMER_KEY = "test-consumer-key"
    const { isMastercardEnhancedEnabled } = await import("@/lib/integrations/mastercard/enhancedServices")
    expect(isMastercardEnhancedEnabled()).toBe(true)
  })

  it("fetchMastercardIdentityInsights returns null without credentials", async () => {
    vi.mocked(loadPrivateKeyFromEnv).mockReturnValue(null)
    delete process.env.MASTERCARD_CONSUMER_KEY
    const { fetchMastercardIdentityInsights } = await import("@/lib/integrations/mastercard/enhancedServices")
    const result = await fetchMastercardIdentityInsights({ bin: "411111" })
    expect(result).toBeNull()
  })

  it("fetchMastercardFraudScore returns null without credentials", async () => {
    vi.mocked(loadPrivateKeyFromEnv).mockReturnValue(null)
    delete process.env.MASTERCARD_CONSUMER_KEY
    const { fetchMastercardFraudScore } = await import("@/lib/integrations/mastercard/enhancedServices")
    const result = await fetchMastercardFraudScore({ bin: "411111" })
    expect(result).toBeNull()
  })

  it("fetchMastercardIdentityInsights handles API errors gracefully", async () => {
    vi.mocked(loadPrivateKeyFromEnv).mockReturnValue("-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----")
    process.env.MASTERCARD_CONSUMER_KEY = "test-key"
    process.env.MASTERCARD_API_BASE = "https://sandbox.api.mastercard.com"

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    )

    const { fetchMastercardIdentityInsights } = await import("@/lib/integrations/mastercard/enhancedServices")
    const result = await fetchMastercardIdentityInsights({ bin: "411111" })
    expect(result).toBeNull()
    fetchSpy.mockRestore()
  })

  it("fetchMastercardFraudScore normalizes score correctly", async () => {
    vi.mocked(loadPrivateKeyFromEnv).mockReturnValue("-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----")
    process.env.MASTERCARD_CONSUMER_KEY = "test-key"
    process.env.MASTERCARD_API_BASE = "https://sandbox.api.mastercard.com"

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        score: 300,
        reasonCodes: [{ code: "R01", description: "Low risk" }],
      }), { status: 200 }),
    )

    const { fetchMastercardFraudScore } = await import("@/lib/integrations/mastercard/enhancedServices")
    const result = await fetchMastercardFraudScore({ bin: "411111", amount: 100, currency: "BRL" })

    expect(result).not.toBeNull()
    expect(result!.fraudScore).toBe(300)
    expect(result!.fraudScoreNormalized).toBe(30) // 300/999 * 100 ≈ 30
    expect(result!.riskLevel).toBe("LOW")
    expect(result!.reasonCodes).toEqual(["R01"])
    expect(result!.source).toBe("MASTERCARD_FRAUD")
    fetchSpy.mockRestore()
  })
})
