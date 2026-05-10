import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    number_valid: z.boolean().optional(),
    international_calling_code: z.string().optional(),
    country_code: z.string().optional(),
    hlr_valid: z.boolean().optional(),
    hlr_status: z.string().optional(),
    ported_network: z.string().optional(),
    current_network: z.string().optional(),
    origin_network: z.string().optional(),
    is_ported: z.boolean().optional(),
    is_roaming: z.boolean().optional(),
  })
  .passthrough()

export type HlrLookupResponse = z.infer<typeof schema>

export async function fetchHlrLookupDetailed(input: { number: string; countryCode?: string }): Promise<NeutrinoResponse<HlrLookupResponse>> {
  return executeNeutrinoRequest({
    endpoint: "hlr-lookup",
    operation: "hlr-lookup",
    body: {
      number: input.number,
      "country-code": input.countryCode,
    },
    cacheKey: `neutrino:hlr-lookup:${input.countryCode ?? ""}:${input.number}`,
    cacheTtlSeconds: 60 * 60,
    schema,
  })
}

export async function fetchHlrLookup(input: { number: string; countryCode?: string }): Promise<HlrLookupResponse> {
  const response = await fetchHlrLookupDetailed(input)
  return response.data
}

