import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    valid: z.boolean().optional(),
    is_subdomain: z.boolean().optional(),
    domain: z.string().optional(),
    tld: z.string().optional(),
    fqdn: z.string().optional(),
    registrar_name: z.string().optional(),
    registrar_id: z.string().optional(),
    created_date: z.string().optional(),
    expires_date: z.string().optional(),
    age: z.number().optional(),
    ip_addresses: z.array(z.string()).optional(),
    mx_records: z.array(z.string()).optional(),
    is_malicious: z.boolean().optional(),
    is_parking: z.boolean().optional(),
    whois_raw: z.string().optional(),
  })
  .passthrough()

export type DomainLookupResponse = z.infer<typeof schema>

export async function fetchDomainLookupDetailed(input: { host: string; live?: boolean }): Promise<NeutrinoResponse<DomainLookupResponse>> {
  return executeNeutrinoRequest({
    endpoint: "domain-lookup",
    operation: "domain-lookup",
    body: {
      host: input.host,
      live: input.live,
    },
    cacheKey: `neutrino:domain-lookup:${input.host.toLowerCase()}:${input.live ?? ""}`,
    cacheTtlSeconds: 60 * 60,
    schema,
  })
}

export async function fetchDomainLookup(input: { host: string; live?: boolean }): Promise<DomainLookupResponse> {
  const response = await fetchDomainLookupDetailed(input)
  return response.data
}

