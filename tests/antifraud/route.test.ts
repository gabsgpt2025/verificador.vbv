import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"
import type { SessionRiskResponse } from "@/lib/premium-3-0/holisticTypes"

// ============================================================================
// Mock analyzeSessionRisk
// ============================================================================

const { analyzeSessionRiskMock } = vi.hoisted(() => ({
  analyzeSessionRiskMock: vi.fn(),
}))

vi.mock("@/lib/premium-3-0/sessionRisk", () => ({
  analyzeSessionRisk: analyzeSessionRiskMock,
}))

import { POST } from "@/app/api/antifraud-session/route"

// ============================================================================
// Helpers
// ============================================================================

function makeRequest(body?: unknown, headers?: Record<string, string>): NextRequest {
  const url = "http://localhost/api/antifraud-session"
  const init: RequestInit = {
    method: "POST",
    headers: {
      "content-type": body !== undefined ? "application/json" : "text/plain",
      "user-agent": "Mozilla/5.0 (Test)",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }
  return new Request(url, init) as unknown as NextRequest
}

function makeSessionRiskResponse(overrides: Partial<SessionRiskResponse> = {}): SessionRiskResponse {
  return {
    ip: "201.45.67.89",
    ipMasked: "201.x.x.89",
    geo: { country: "BR", city: "São Paulo", isp: "Claro", asn: "AS28573", hostname: null },
    network: {
      isTor: false,
      isProxy: false,
      isVpn: false,
      isHijacked: false,
      isSpider: false,
      isMalware: false,
      isBot: false,
      isListed: false,
      blocklistCount: 0,
    },
    device: {
      browser: "Chrome",
      browserVersion: "120",
      os: "Android",
      osVersion: "14",
      deviceType: "MOBILE",
      isMobile: true,
      isBot: false,
    },
    hostReputation: null,
    client: { fingerprint: null, timezone: "America/Sao_Paulo", languages: ["pt-BR"], screen: null },
    riskScore: 15,
    riskLevel: "LOW",
    recommendation: "ALLOW",
    factors: [],
    sourcesUsed: ["neutrino:ip-info"],
    generatedAt: "2026-05-08T23:00:00.000Z",
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("POST /api/antifraud-session", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns 200 with empty body (no content-type)", async () => {
    analyzeSessionRiskMock.mockResolvedValue(makeSessionRiskResponse())

    const request = new Request("http://localhost/api/antifraud-session", {
      method: "POST",
      headers: { "user-agent": "TestUA" },
    }) as unknown as NextRequest

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.data).toBeDefined()
  })

  it("returns 200 with valid JSON body", async () => {
    analyzeSessionRiskMock.mockResolvedValue(makeSessionRiskResponse())

    const request = makeRequest({
      fingerprint: "abc123",
      screen: { w: 1920, h: 1080, colorDepth: 24 },
      languages: ["pt-BR"],
      timezone: "America/Sao_Paulo",
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.data).toBeDefined()
    expect(json.data.ipMasked).toBe("201.x.x.89")
  })

  it("returns 400 for malformed body (invalid screen dimensions)", async () => {
    const request = makeRequest({ screen: { w: -1, h: 1080, colorDepth: 24 } })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.ok).toBe(false)
    expect(json.error.code).toBe("INVALID_REQUEST")
  })

  it("returns 400 for invalid JSON body", async () => {
    const url = "http://localhost/api/antifraud-session"
    const request = new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not valid json{{",
    }) as unknown as NextRequest

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.ok).toBe(false)
  })

  it("never exposes raw IP in response — only ipMasked", async () => {
    const mockResult = makeSessionRiskResponse({ ip: "201.45.67.89", ipMasked: "201.x.x.89" })
    analyzeSessionRiskMock.mockResolvedValue(mockResult)

    const request = makeRequest({})
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    // The raw 'ip' field must not be present in the serialized response
    expect(json.data.ip).toBeUndefined()
    expect(json.data.ipMasked).toBe("201.x.x.89")
    // The raw IP must not appear anywhere in the JSON string
    expect(JSON.stringify(json)).not.toContain("201.45.67.89")
  })

  it("extracts IP from x-forwarded-for header and passes to engine", async () => {
    analyzeSessionRiskMock.mockResolvedValue(makeSessionRiskResponse())

    const request = makeRequest({}, { "x-forwarded-for": "5.6.7.8, 10.0.0.1" })
    await POST(request)

    expect(analyzeSessionRiskMock).toHaveBeenCalledWith(
      expect.objectContaining({ ip: "5.6.7.8" }),
    )
  })

  it("extracts IP from cf-connecting-ip header (Cloudflare)", async () => {
    analyzeSessionRiskMock.mockResolvedValue(makeSessionRiskResponse())

    const request = makeRequest({}, { "cf-connecting-ip": "9.10.11.12" })
    await POST(request)

    expect(analyzeSessionRiskMock).toHaveBeenCalledWith(
      expect.objectContaining({ ip: "9.10.11.12" }),
    )
  })

  it("skips private/loopback IPs — passes null to engine", async () => {
    analyzeSessionRiskMock.mockResolvedValue(makeSessionRiskResponse({ ip: null, ipMasked: "x.x.x.x" }))

    const request = makeRequest({}, { "x-forwarded-for": "192.168.1.1" })
    await POST(request)

    expect(analyzeSessionRiskMock).toHaveBeenCalledWith(
      expect.objectContaining({ ip: null }),
    )
  })

  it("returns 500 on engine failure", async () => {
    analyzeSessionRiskMock.mockRejectedValue(new Error("engine crash"))

    const request = makeRequest({})
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.ok).toBe(false)
    expect(json.error.code).toBe("INTERNAL_SERVER_ERROR")
  })
})
