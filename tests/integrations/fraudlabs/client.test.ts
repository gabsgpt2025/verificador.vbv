import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock do cache
vi.mock("@/lib/premium-3-0/runtime/cache", () => ({
  getCache: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  }),
}))

describe("FraudLabs Pro Client", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it("should return null when API key is not configured", async () => {
    delete process.env.FRAUDLABS_PRO_API_KEY
    const { screenOrderFraudLabs } = await import("@/lib/integrations/fraudlabs/client")
    const result = await screenOrderFraudLabs({ ip: "1.2.3.4", bin: "411111" })
    expect(result).toBeNull()
  })

  it("should return null when API key is empty", async () => {
    process.env.FRAUDLABS_PRO_API_KEY = ""
    const { screenOrderFraudLabs } = await import("@/lib/integrations/fraudlabs/client")
    const result = await screenOrderFraudLabs({ ip: "1.2.3.4", bin: "411111" })
    expect(result).toBeNull()
  })

  it("isFraudLabsEnabled returns true when key is set and FRAUDLABS_ENABLED is true", async () => {
    process.env.FRAUDLABS_PRO_API_KEY = "test-key-123"
    process.env.FRAUDLABS_ENABLED = "true"
    const { isFraudLabsEnabled } = await import("@/lib/integrations/fraudlabs/client")
    expect(isFraudLabsEnabled()).toBe(true)
  })

  it("isFraudLabsEnabled returns false when key is set but FRAUDLABS_ENABLED is false", async () => {
    process.env.FRAUDLABS_PRO_API_KEY = "test-key-123"
    process.env.FRAUDLABS_ENABLED = "false"
    const { isFraudLabsEnabled } = await import("@/lib/integrations/fraudlabs/client")
    expect(isFraudLabsEnabled()).toBe(false)
  })

  it("isFraudLabsEnabled returns false when key is set but FRAUDLABS_ENABLED is missing", async () => {
    process.env.FRAUDLABS_PRO_API_KEY = "test-key-123"
    delete process.env.FRAUDLABS_ENABLED
    const { isFraudLabsEnabled } = await import("@/lib/integrations/fraudlabs/client")
    expect(isFraudLabsEnabled()).toBe(false)
  })

  it("isFraudLabsEnabled returns false when key is missing", async () => {
    delete process.env.FRAUDLABS_PRO_API_KEY
    const { isFraudLabsEnabled } = await import("@/lib/integrations/fraudlabs/client")
    expect(isFraudLabsEnabled()).toBe(false)
  })

  it("should handle API errors gracefully", async () => {
    process.env.FRAUDLABS_PRO_API_KEY = "test-key-123"

    // Mock fetch to return error
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500, statusText: "Internal Server Error" }),
    )

    const { screenOrderFraudLabs } = await import("@/lib/integrations/fraudlabs/client")
    const result = await screenOrderFraudLabs({ ip: "1.2.3.4", bin: "411111" })
    expect(result).toBeNull()
    fetchSpy.mockRestore()
  })

  it("should normalize a successful API response", async () => {
    process.env.FRAUDLABS_PRO_API_KEY = "test-key-123"

    const mockResponse = {
      fraudlabspro_id: "test-id-123",
      fraudlabspro_score: 25,
      fraudlabspro_status: "APPROVE",
      fraudlabspro_message: "Transaction approved",
      fraudlabspro_credits: 450,
      ip_country: "Brazil",
      ip_isp: "Vivo",
      is_proxy_ip_address: "N",
      is_country_match: "Y",
      is_ip_blacklist: "N",
      is_high_risk_country: "N",
      is_bin_found: "Y",
      bin_prepaid: "N",
      bin_country: "Brazil",
      bin_country_code: "BR",
      bin_name: "Banco Itau",
    }

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    )

    const { screenOrderFraudLabs } = await import("@/lib/integrations/fraudlabs/client")
    const result = await screenOrderFraudLabs({ ip: "1.2.3.4", bin: "411111" })

    expect(result).not.toBeNull()
    expect(result!.fraudScore).toBe(25)
    expect(result!.status).toBe("APPROVE")
    expect(result!.isProxy).toBe(false)
    expect(result!.isCountryMatch).toBe(true)
    expect(result!.isIpBlacklisted).toBe(false)
    expect(result!.binCountry).toBe("BR")
    expect(result!.binIssuer).toBe("Banco Itau")
    expect(result!.creditsRemaining).toBe(450)
    fetchSpy.mockRestore()
  })

  it("should handle timeout errors", async () => {
    process.env.FRAUDLABS_PRO_API_KEY = "test-key-123"

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(
      Object.assign(new Error("The operation was aborted"), { name: "AbortError" }),
    )

    const { screenOrderFraudLabs } = await import("@/lib/integrations/fraudlabs/client")
    const result = await screenOrderFraudLabs({ ip: "1.2.3.4", bin: "411111" })
    expect(result).toBeNull()
    fetchSpy.mockRestore()
  })
})
