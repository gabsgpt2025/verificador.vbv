import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    found: z.number().optional(),
    address: z.string().optional(),
    address_components: z.unknown().optional(),
    country_code: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
  })
  .passthrough()

export type GeocodeReverseResponse = z.infer<typeof schema>

export async function fetchGeocodeReverseDetailed(input: {
  latitude: string
  longitude: string
  languageCode?: string
}): Promise<NeutrinoResponse<GeocodeReverseResponse>> {
  return executeNeutrinoRequest({
    endpoint: "geocode-reverse",
    operation: "geocode-reverse",
    body: {
      latitude: input.latitude,
      longitude: input.longitude,
      "language-code": input.languageCode,
    },
    cacheKey: `neutrino:geocode-reverse:${input.latitude}:${input.longitude}:${input.languageCode ?? ""}`,
    cacheTtlSeconds: 24 * 60 * 60,
    schema,
  })
}

export async function fetchGeocodeReverse(input: {
  latitude: string
  longitude: string
  languageCode?: string
}): Promise<GeocodeReverseResponse> {
  const response = await fetchGeocodeReverseDetailed(input)
  return response.data
}

