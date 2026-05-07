import { describe, expect, it } from "vitest"
import { applyBinOverrides } from "../lib/premium-3-0/applyBinOverrides"
import type { BinApiData } from "../lib/premium-3-0/types"

describe("applyBinOverrides", () => {
  it("applies overrides returned in snake_case from Supabase", async () => {
    const binData: BinApiData = {
      bin: "405708",
      binLength: 6,
      source: "NEUTRINO",
      issuer: "Old Issuer",
    }

    const supabase = {
      from: () => ({
        select: () => ({
          eq: async () => ({
            data: [
              {
                field: "issuer",
                old_value: "Old Issuer",
                corrected_value: "New Issuer",
                reason: "Analyst correction",
              },
            ],
            error: null,
          }),
        }),
      }),
    }

    const result = await applyBinOverrides(supabase, binData)

    expect(result.data.issuer).toBe("New Issuer")
    expect(result.overridesApplied[0]).toContain("Old Issuer")
    expect(result.overridesApplied[0]).toContain("New Issuer")
  })
})
