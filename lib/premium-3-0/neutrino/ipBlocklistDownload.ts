import { executeNeutrinoBinaryRequest } from "./client"
import type { NeutrinoResponse } from "./types"

export async function fetchIpBlocklistDownloadDetailed(input: {
  format?: "csv" | "txt"
  cidr?: boolean
  ip6?: boolean
}): Promise<NeutrinoResponse<ArrayBuffer>> {
  return executeNeutrinoBinaryRequest({
    endpoint: "ip-blocklist-download",
    operation: "ip-blocklist-download",
    body: {
      format: input.format,
      cidr: input.cidr,
      ip6: input.ip6,
    },
    cacheKey: `neutrino:ip-blocklist-download:${input.format ?? ""}:${input.cidr ?? ""}:${input.ip6 ?? ""}`,
    cacheTtlSeconds: 60 * 60,
  })
}

export async function fetchIpBlocklistDownload(input: {
  format?: "csv" | "txt"
  cidr?: boolean
  ip6?: boolean
}): Promise<ArrayBuffer> {
  const response = await fetchIpBlocklistDownloadDetailed(input)
  return response.data
}

