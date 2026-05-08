import { beforeEach, describe, expect, it, vi } from "vitest"

const { signRequestMock, loadPrivateKeyFromEnvMock } = vi.hoisted(() => ({
  signRequestMock: vi.fn(() => ({ authorizationHeader: "OAuth test" })),
  loadPrivateKeyFromEnvMock: vi.fn(() => "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----"),
}))

vi.mock("@/lib/integrations/mastercard/oauthSigner", () => ({
  loadPrivateKeyFromEnv: loadPrivateKeyFromEnvMock,
  signRequest: signRequestMock,
}))

import { lookupMastercardBin } from "@/lib/integrations/mastercard/binLookupClient"
import { resetCacheState } from "@/lib/premium-3-0/runtime/cache"

describe("lookupMastercardBin", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetCacheState()
    process.env.MASTERCARD_CONSUMER_KEY = "consumer-key"
    process.env.MASTERCARD_API_BASE = "https://sandbox.api.mastercard.com"
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    global.fetch = vi.fn()
  })

  it("retorna null silenciosamente quando a chave está ausente", async () => {
    delete process.env.MASTERCARD_CONSUMER_KEY
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined)

    const result = await lookupMastercardBin("553133")

    expect(result).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
    expect(infoSpy).toHaveBeenCalledWith(
      "[MASTERCARD] Client disabled: missing MASTERCARD_CONSUMER_KEY or MASTERCARD_PRIVATE_KEY",
    )
  })

  it("faz retry único em 5xx e armazena em cache o resultado normalizado", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            binLength: 6,
            accountRanges: [
              {
                brand: "MASTERCARD",
                productCode: "MWE",
                productName: "World Elite",
                productCategory: "COMMERCIAL",
                cardType: "CREDIT",
                countryCode: "BRA",
                countryName: "Brazil",
                issuerName: "Bradesco",
                issuerCountry: "Brazil",
                acceptanceBrand: "MASTERCARD",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )

    const first = await lookupMastercardBin("553133")
    const second = await lookupMastercardBin("553133")

    expect(first?.productCode).toBe("MWE")
    expect(first?.countryCode).toBe("BRA")
    expect(first?.source).toBe("MASTERCARD")
    expect(second).toEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(signRequestMock).toHaveBeenCalledTimes(2)
  })

  it("retorna null para 404", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(new Response("not found", { status: 404 }))

    const result = await lookupMastercardBin("553133")

    expect(result).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
