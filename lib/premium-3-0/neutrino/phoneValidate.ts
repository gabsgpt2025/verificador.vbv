import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    valid: z.boolean().optional(),
    international_calling_code: z.string().optional(),
    country_code: z.string().optional(),
    local_number: z.string().optional(),
    is_mobile: z.boolean().optional(),
    type: z.string().optional(),
    location: z.string().optional(),
    country: z.string().optional(),
    currency_code: z.string().optional(),
    prefix_network: z.string().optional(),
  })
  .passthrough()

export type PhoneValidateResponse = z.infer<typeof schema>

export async function fetchPhoneValidateDetailed(input: { number: string; countryCode?: string }): Promise<NeutrinoResponse<PhoneValidateResponse>> {
  return executeNeutrinoRequest({
    endpoint: "phone-validate",
    operation: "phone-validate",
    body: {
      number: input.number,
      "country-code": input.countryCode,
    },
    cacheKey: `neutrino:phone-validate:${input.countryCode ?? ""}:${input.number}`,
    cacheTtlSeconds: 24 * 60 * 60,
    schema,
  })
}

export async function fetchPhoneValidate(input: { number: string; countryCode?: string }): Promise<PhoneValidateResponse> {
  const response = await fetchPhoneValidateDetailed(input)
  return response.data
}

