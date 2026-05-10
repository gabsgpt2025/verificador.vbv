import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    is_bad: z.boolean().optional(),
    bad_words_total: z.number().optional(),
    bad_words_list: z.array(z.string()).optional(),
    censored_content: z.string().optional(),
  })
  .passthrough()

export type BadWordFilterResponse = z.infer<typeof schema>

export async function fetchBadWordFilterDetailed(input: { content: string; censorCharacter?: string }): Promise<NeutrinoResponse<BadWordFilterResponse>> {
  return executeNeutrinoRequest({
    endpoint: "bad-word-filter",
    operation: "bad-word-filter",
    body: {
      content: input.content,
      "censor-character": input.censorCharacter,
    },
    cacheKey: `neutrino:bad-word-filter:${input.censorCharacter ?? "*"}:${input.content}`,
    cacheTtlSeconds: 5 * 60,
    schema,
  })
}

export async function fetchBadWordFilter(input: { content: string; censorCharacter?: string }): Promise<BadWordFilterResponse> {
  const response = await fetchBadWordFilterDetailed(input)
  return response.data
}

