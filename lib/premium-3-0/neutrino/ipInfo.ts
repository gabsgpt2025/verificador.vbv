import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    valid: z.boolean().optional(),
    country_code: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
    ip: z.string().optional(),
    provider: z.string().optional(),
    is_vpn: z.boolean().optional(),
    is_proxy: z.boolean().optional(),
    is_tor: z.boolean().optional(),
    is_hosting: z.boolean().optional(),
    is_bogon: z.boolean().optional(),
  })
  .passthrough()

export type IpInfoResponse = z.infer<typeof schema>

export async function fetchIpInfoDetailed(input: { ip: string }): Promise<NeutrinoResponse<IpInfoResponse>> {
  return executeNeutrinoRequest({
    endpoint: "ip-info",
    operation: "ip-info",
    body: { ip: input.ip },
    cacheKey: `neutrino:ip-info:${input.ip}`,
    cacheTtlSeconds: 60 * 60,
    schema,
  })
}

export async function fetchIpInfo(input: { ip: string }): Promise<IpInfoResponse> {
  const response = await fetchIpInfoDetailed(input)
  return response.data
}
