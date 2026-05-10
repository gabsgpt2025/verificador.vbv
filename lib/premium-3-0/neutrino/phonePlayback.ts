import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    number_valid: z.boolean().optional(),
    call_id: z.string().optional(),
  })
  .passthrough()

export type PhonePlaybackResponse = z.infer<typeof schema>

export async function fetchPhonePlaybackDetailed(input: {
  number: string
  audioUrl: string
  countryCode?: string
}): Promise<NeutrinoResponse<PhonePlaybackResponse>> {
  return executeNeutrinoRequest({
    endpoint: "phone-playback",
    operation: "phone-playback",
    body: {
      number: input.number,
      "audio-url": input.audioUrl,
      "country-code": input.countryCode,
    },
    cacheKey: `neutrino:phone-playback:${input.number}:${input.audioUrl}:${input.countryCode ?? ""}`,
    cacheTtlSeconds: 0,
    schema,
  })
}

export async function fetchPhonePlayback(input: {
  number: string
  audioUrl: string
  countryCode?: string
}): Promise<PhonePlaybackResponse> {
  const response = await fetchPhonePlaybackDetailed(input)
  return response.data
}

