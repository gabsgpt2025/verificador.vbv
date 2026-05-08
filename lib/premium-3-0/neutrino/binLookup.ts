import { z } from "zod"
import type { NeutrinoBinResponse } from "@/lib/premium-3-0/types"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    bin: z.string().optional(),
    valid: z.boolean().optional(),
    card_brand: z.string().optional(),
    card_type: z.string().optional(),
    card_category: z.string().optional(),
    issuer_name: z.string().optional(),
    issuer_website: z.string().optional(),
    issuer_phone: z.string().optional(),
    country_code: z.string().optional(),
    country_name: z.string().optional(),
    country_iso3: z.string().optional(),
    country_continent: z.string().optional(),
    country_population: z.number().optional(),
    currency_code: z.string().optional(),
    currency_name: z.string().optional(),
    is_commercial: z.boolean().optional(),
    is_prepaid: z.boolean().optional(),
    is_3d_secure: z.boolean().optional(),
    risk_level: z.string().optional(),
  })
  .passthrough()

export type BinLookupResponse = NeutrinoBinResponse

export async function fetchBinLookupDetailed(bin: string): Promise<NeutrinoResponse<BinLookupResponse>> {
  const sanitizedBin = bin.replace(/\s/g, "").substring(0, 8)

  return executeNeutrinoRequest({
    endpoint: "bin-lookup",
    operation: "bin-lookup",
    body: { "bin-number": sanitizedBin },
    cacheKey: `neutrino:bin-lookup:${sanitizedBin}`,
    cacheTtlSeconds: 7 * 24 * 3600,
    schema,
  })
}

export async function fetchBinLookup(bin: string): Promise<BinLookupResponse> {
  const response = await fetchBinLookupDetailed(bin)
  return response.data
}
