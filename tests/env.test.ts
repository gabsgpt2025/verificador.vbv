import { afterEach, describe, expect, it, vi } from "vitest"

async function loadEnvModule() {
  vi.resetModules()
  return import("@/lib/env")
}

describe("env validation", () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("falha explicitamente em produção sem credenciais Neutrino", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      NEXT_PUBLIC_REQUIRE_AUTH: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    }

    const { getNeutrinoCredentials } = await loadEnvModule()

    expect(() => getNeutrinoCredentials()).toThrow(/NEUTRINO_API_KEY e NEUTRINO_USER_ID são obrigatórias em produção/)
  })

  it("aceita desenvolvimento sem credenciais Neutrino", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
      NEXT_PUBLIC_REQUIRE_AUTH: "false",
    }

    const { getEnv } = await loadEnvModule()

    expect(getEnv().NEXT_PUBLIC_REQUIRE_AUTH).toBe("false")
  })

  it("expõe as novas flags Neutrino com default false e coerção booleana", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
      NEUTRINO_BAD_WORD_FILTER_ENABLED: "true",
      NEUTRINO_SMS_VERIFY_ENABLED: "1",
    }

    const { getEnv } = await loadEnvModule()
    const env = getEnv()

    expect(env.NEUTRINO_BAD_WORD_FILTER_ENABLED).toBe(true)
    expect(env.NEUTRINO_SMS_VERIFY_ENABLED).toBe(true)
    expect(env.NEUTRINO_STATS_ENABLED).toBe(false)
    expect(env.NEUTRINO_BROWSER_BOT_ENABLED).toBe(false)
  })
})
