import { executeNeutrinoBinaryRequest } from "./client"
import type { NeutrinoResponse } from "./types"

export async function fetchBinListDownloadDetailed(input: {
  includeIso3?: boolean
  includeNativeName?: boolean
}): Promise<NeutrinoResponse<ArrayBuffer>> {
  return executeNeutrinoBinaryRequest({
    endpoint: "bin-list-download",
    operation: "bin-list-download",
    body: {
      "include-iso3": input.includeIso3,
      "include-native-name": input.includeNativeName,
    },
    cacheKey: `neutrino:bin-list-download:${input.includeIso3 ?? ""}:${input.includeNativeName ?? ""}`,
    cacheTtlSeconds: 24 * 60 * 60,
  })
}

export async function fetchBinListDownload(input: {
  includeIso3?: boolean
  includeNativeName?: boolean
}): Promise<ArrayBuffer> {
  const response = await fetchBinListDownloadDetailed(input)
  return response.data
}

