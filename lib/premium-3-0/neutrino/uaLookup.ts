import { createHash } from "crypto"
import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    type: z.string().optional(),
    browser: z.string().optional(),
    browser_version: z.string().optional(),
    os: z.string().optional(),
    os_version: z.string().optional(),
    device_model: z.string().optional(),
    device_brand: z.string().optional(),
    is_mobile: z.boolean().optional(),
    is_bot: z.boolean().optional(),
    bot_category: z.string().optional(),
  })
  .passthrough()

export type UaLookupResponse = z.infer<typeof schema>

function hashUserAgent(userAgent: string): string {
  return createHash("sha256").update(userAgent).digest("hex")
}

export async function fetchUaLookupDetailed(input: { ua: string }): Promise<NeutrinoResponse<UaLookupResponse>> {
  return executeNeutrinoRequest({
    endpoint: "ua-lookup",
    operation: "ua-lookup",
    body: { ua: input.ua },
    cacheKey: `neutrino:ua-lookup:${hashUserAgent(input.ua)}`,
    cacheTtlSeconds: 24 * 60 * 60,
    schema,
  })
}

export async function fetchUaLookup(input: { ua: string }): Promise<UaLookupResponse> {
  const response = await fetchUaLookupDetailed(input)
  return response.data
}
