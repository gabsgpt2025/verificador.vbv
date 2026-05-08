/**
 * @deprecated Use modules from `@/lib/premium-3-0/neutrino` instead.
 */

import type { NeutrinoBinResponse } from "@/lib/premium-3-0/types"
import { fetchBinLookup, fetchBinLookupDetailed } from "@/lib/premium-3-0/neutrino"

/**
 * @deprecated Use `fetchBinLookup` from `@/lib/premium-3-0/neutrino/binLookup`.
 */
export async function callNeutrinoApi(bin: string): Promise<NeutrinoBinResponse> {
  return fetchBinLookup(bin)
}

export { fetchBinLookup, fetchBinLookupDetailed }
export type { BinLookupResponse } from "@/lib/premium-3-0/neutrino"
export * from "@/lib/premium-3-0/neutrino"
