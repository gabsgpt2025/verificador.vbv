import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

const { createClientMock, fetchMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  fetchMock: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}))

vi.stubGlobal("fetch", fetchMock)

import { POST } from "@/app/api/bin/verify/route"

describe("/api/bin/verify route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
    })
  })

  it("retorna erro estruturado para BIN inválido", async () => {
    const request = new Request("http://localhost/api/bin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ binNumber: "123" }),
    }) as NextRequest

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.ok).toBe(false)
    expect(payload.error.code).toBe("INVALID_BIN")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("propaga erro estruturado do endpoint canônico sem fallback", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: "UPSTREAM_NEUTRINO_FAILURE",
            message: "Falha temporária na consulta do BIN. Tente novamente.",
          },
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )

    const request = new Request("http://localhost/api/bin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ binNumber: "411111" }),
    }) as NextRequest

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload.ok).toBe(false)
    expect(payload.error.code).toBe("UPSTREAM_NEUTRINO_FAILURE")
  })
})
