import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    number_valid: z.boolean().optional(),
    security_code: z.string().optional(),
    sent: z.boolean().optional(),
  })
  .passthrough()

export type SmsVerifyResponse = z.infer<typeof schema>

export async function fetchSmsVerifyDetailed(input: {
  number: string
  countryCode?: string
  securityCode?: string
  languageCode?: string
  limit?: number
}): Promise<NeutrinoResponse<SmsVerifyResponse>> {
  return executeNeutrinoRequest({
    endpoint: "sms-verify",
    operation: "sms-verify",
    body: {
      number: input.number,
      "country-code": input.countryCode,
      "security-code": input.securityCode,
      "language-code": input.languageCode,
      limit: input.limit,
    },
    cacheKey: `neutrino:sms-verify:${input.number}:${input.countryCode ?? ""}:${input.securityCode ?? ""}:${input.languageCode ?? ""}:${input.limit ?? ""}`,
    cacheTtlSeconds: 0,
    schema,
  })
}

export async function fetchSmsVerify(input: {
  number: string
  countryCode?: string
  securityCode?: string
  languageCode?: string
  limit?: number
}): Promise<SmsVerifyResponse> {
  const response = await fetchSmsVerifyDetailed(input)
  return response.data
}

