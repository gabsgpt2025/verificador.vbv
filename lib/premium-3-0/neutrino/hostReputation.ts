import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    host: z.string().optional(),
    is_listed: z.boolean().optional(),
    reputation_score: z.number().optional(),
    lists: z.array(z.string()).optional(),
  })
  .passthrough()

export type HostReputationResponse = z.infer<typeof schema>

export async function fetchHostReputationDetailed(input: { host: string }): Promise<NeutrinoResponse<HostReputationResponse>> {
  return executeNeutrinoRequest({
    endpoint: "host-reputation",
    operation: "host-reputation",
    body: { host: input.host },
    cacheKey: `neutrino:host-reputation:${input.host.toLowerCase()}`,
    cacheTtlSeconds: 60 * 60,
    schema,
  })
}

export async function fetchHostReputation(input: { host: string }): Promise<HostReputationResponse> {
  const response = await fetchHostReputationDetailed(input)
  return response.data
}
