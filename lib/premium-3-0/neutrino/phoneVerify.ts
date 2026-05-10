import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    number_valid: z.boolean().optional(),
    security_code: z.string().optional(),
    call_id: z.string().optional(),
  })
  .passthrough()

export type PhoneVerifyResponse = z.infer<typeof schema>

export async function fetchPhoneVerifyDetailed(input: {
  number: string
  countryCode?: string
  securityCode?: string
  languageCode?: string
  playbackDelay?: number
}): Promise<NeutrinoResponse<PhoneVerifyResponse>> {
  return executeNeutrinoRequest({
    endpoint: "phone-verify",
    operation: "phone-verify",
    body: {
      number: input.number,
      "country-code": input.countryCode,
      "security-code": input.securityCode,
      "language-code": input.languageCode,
      "playback-delay": input.playbackDelay,
    },
    cacheKey: `neutrino:phone-verify:${input.number}:${input.countryCode ?? ""}:${input.securityCode ?? ""}:${input.languageCode ?? ""}:${input.playbackDelay ?? ""}`,
    cacheTtlSeconds: 0,
    schema,
  })
}

export async function fetchPhoneVerify(input: {
  number: string
  countryCode?: string
  securityCode?: string
  languageCode?: string
  playbackDelay?: number
}): Promise<PhoneVerifyResponse> {
  const response = await fetchPhoneVerifyDetailed(input)
  return response.data
}

