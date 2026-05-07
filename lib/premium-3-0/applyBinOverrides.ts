// lib/premium-3-0/applyBinOverrides.ts
// Aplica correções manuais (overrides) antes da análise final

import type { BinApiData, BinOverride } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

export async function applyBinOverrides(
  supabase: SupabaseClient,
  binData: BinApiData,
): Promise<{ data: BinApiData; overridesApplied: string[] }> {
  const overridesApplied: string[] = []

  const { data: overrides, error } = await supabase
    .from("bin_intelligence_overrides")
    .select("*")
    .eq("bin", binData.bin)

  if (error || !overrides || overrides.length === 0) {
    return { data: binData, overridesApplied }
  }

  const result = { ...binData }

  for (const override of overrides) {
    const field = override.field as keyof BinApiData
    // Only apply overrides to string/boolean fields, not to bin or source
    if (field === "bin" || field === "source" || field === "raw" || field === "binLength") continue

    // Apply the correction
    const correctedValue = override.corrected_value ?? override.correctedValue
    const oldValue = override.old_value ?? override.oldValue

    ;(result as Record<string, unknown>)[field] = correctedValue
    overridesApplied.push(`${field}: "${oldValue}" → "${correctedValue}" (${override.reason})`)
  }

  return { data: result, overridesApplied }
}
