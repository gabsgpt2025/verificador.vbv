import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    ip: z.string().optional(),
    valid: z.boolean().optional(),
    country_code: z.string().optional(),
    is_vpn: z.boolean().optional(),
    is_proxy: z.boolean().optional(),
    is_tor: z.boolean().optional(),
    is_hosting: z.boolean().optional(),
    is_bogon: z.boolean().optional(),
    provider: z.string().optional(),
    asn: z.string().optional(),
  })
  .passthrough()

export type IpProbeResponse = z.infer<typeof schema>

export async function fetchIpProbeDetailed(input: { ip: string }): Promise<NeutrinoResponse<IpProbeResponse>> {
  return executeNeutrinoRequest({
    endpoint: "ip-probe",
    operation: "ip-probe",
    body: { ip: input.ip },
    cacheKey: `neutrino:ip-probe:${input.ip}`,
    cacheTtlSeconds: 30 * 60,
    schema,
  })
}

export async function fetchIpProbe(input: { ip: string }): Promise<IpProbeResponse> {
  const response = await fetchIpProbeDetailed(input)
  return response.data
}
