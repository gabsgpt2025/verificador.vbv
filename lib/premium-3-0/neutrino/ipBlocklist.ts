import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    ip: z.string().optional(),
    is_listed: z.boolean().optional(),
    blocklists: z.array(z.string()).optional(),
    list_count: z.number().optional(),
  })
  .passthrough()

export type IpBlocklistResponse = z.infer<typeof schema>

export async function fetchIpBlocklistDetailed(input: { ip: string }): Promise<NeutrinoResponse<IpBlocklistResponse>> {
  return executeNeutrinoRequest({
    endpoint: "ip-blocklist",
    operation: "ip-blocklist",
    body: { ip: input.ip },
    cacheKey: `neutrino:ip-blocklist:${input.ip}`,
    cacheTtlSeconds: 30 * 60,
    schema,
  })
}

export async function fetchIpBlocklist(input: { ip: string }): Promise<IpBlocklistResponse> {
  const response = await fetchIpBlocklistDetailed(input)
  return response.data
}
