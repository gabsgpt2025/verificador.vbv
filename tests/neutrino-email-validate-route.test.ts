import { afterEach, describe, expect, it, vi } from "vitest"

const { fetchEmailValidateDetailedMock } = vi.hoisted(() => ({
  fetchEmailValidateDetailedMock: vi.fn(),
}))

vi.mock("@/lib/premium-3-0/neutrino", () => ({
  fetchEmailValidateDetailed: fetchEmailValidateDetailedMock,
}))

async function loadRoute() {
  vi.resetModules()
  return import("@/app/api/neutrino/email-validate/route")
}

describe("POST /api/neutrino/email-validate", () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it("returns 503 when feature flag is disabled", async () => {
    process.env = {
      ...originalEnv,
      NEUTRINO_EMAIL_VALIDATE_ENABLED: "false",
    }

    const { POST } = await loadRoute()
    const request = new Request("http://localhost/api/neutrino/email-validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    })

    const response = await POST(request)
    const payload = await response.json()
    expect(response.status).toBe(503)
    expect(payload.success).toBe(false)
    expect(fetchEmailValidateDetailedMock).not.toHaveBeenCalled()
  })

  it("returns success payload when enabled", async () => {
    process.env = {
      ...originalEnv,
      NEUTRINO_EMAIL_VALIDATE_ENABLED: "true",
    }
    fetchEmailValidateDetailedMock.mockResolvedValue({
      data: { valid: true, domain: "example.com" },
      meta: {},
    })

    const { POST } = await loadRoute()
    const request = new Request("http://localhost/api/neutrino/email-validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    })

    const response = await POST(request)
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.valid).toBe(true)
    expect(fetchEmailValidateDetailedMock).toHaveBeenCalledWith({ email: "user@example.com" })
  })
})
