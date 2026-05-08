import { describe, expect, it } from "vitest"

import {
  BANK_REPUTATION_SEED,
  BANK_SUFFIX_PATTERN,
  lookupBankReputation,
  normalizeIssuerName,
} from "@/lib/premium-3-0/enrichment/bankReputation"

describe("bankReputation", () => {
  it("possui seed com pelo menos 40 emissores", () => {
    expect(BANK_REPUTATION_SEED.length).toBeGreaterThanOrEqual(40)
  })

  it("normaliza nome removendo acentos/sufixos", () => {
    expect("Banco do Brasil S.A.".replace(BANK_SUFFIX_PATTERN, "").toLowerCase()).toContain("banco do brasil")
    expect(normalizeIssuerName("Itaú S.A.")).toBe("itau")
  })

  it("faz lookup case-insensitive com país", () => {
    const found = lookupBankReputation("bRaDeScO", "br")
    expect(found.found).toBe(true)
    expect(found.tier).toBe("TIER1")
  })

  it("encontra emissor mesmo sem país quando nome bate", () => {
    const found = lookupBankReputation("Barclays PLC", undefined)
    expect(found.found).toBe(true)
    expect(found.tier).toBe("TIER1")
  })

  it("retorna fallback determinístico quando emissor não existe", () => {
    const found = lookupBankReputation("Banco Fantasma Ltd", "BR")
    expect(found.found).toBe(false)
    expect(found.score).toBe(30)
  })
})
