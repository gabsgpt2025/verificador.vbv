import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const locationSchema = z
  .object({
    address: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    country_code: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    state: z.string().optional(),
    address_components: z.unknown().optional(),
  })
  .passthrough()

const schema = z
  .object({
    found: z.number().optional(),
    locations: z.array(locationSchema).optional(),
  })
  .passthrough()

export type GeocodeAddressResponse = z.infer<typeof schema>

export async function fetchGeocodeAddressDetailed(input: {
  address: string
  countryCode?: string
  languageCode?: string
  fuzzySearch?: boolean
}): Promise<NeutrinoResponse<GeocodeAddressResponse>> {
  return executeNeutrinoRequest({
    endpoint: "geocode-address",
    operation: "geocode-address",
    body: {
      address: input.address,
      "country-code": input.countryCode,
      "language-code": input.languageCode,
      "fuzzy-search": input.fuzzySearch,
    },
    cacheKey: `neutrino:geocode-address:${input.address}:${input.countryCode ?? ""}:${input.languageCode ?? ""}:${input.fuzzySearch ?? ""}`,
    cacheTtlSeconds: 24 * 60 * 60,
    schema,
  })
}

export async function fetchGeocodeAddress(input: {
  address: string
  countryCode?: string
  languageCode?: string
  fuzzySearch?: boolean
}): Promise<GeocodeAddressResponse> {
  const response = await fetchGeocodeAddressDetailed(input)
  return response.data
}

