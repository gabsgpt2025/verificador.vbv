import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    url: z.string().optional(),
    content: z.string().optional(),
    mime_type: z.string().optional(),
    title: z.string().optional(),
    is_error: z.boolean().optional(),
    is_timeout: z.boolean().optional(),
    error_message: z.string().optional(),
    exec_result: z.unknown().optional(),
    status_code: z.number().optional(),
    load_time: z.number().optional(),
  })
  .passthrough()

export type BrowserBotResponse = z.infer<typeof schema>

export async function fetchBrowserBotDetailed(input: {
  url: string
  timeout?: number
  delay?: number
  selector?: string
  exec?: string
}): Promise<NeutrinoResponse<BrowserBotResponse>> {
  return executeNeutrinoRequest({
    endpoint: "browser-bot",
    operation: "browser-bot",
    body: {
      url: input.url,
      timeout: input.timeout,
      delay: input.delay,
      selector: input.selector,
      exec: input.exec,
    },
    cacheKey: `neutrino:browser-bot:${input.url}:${input.selector ?? ""}:${input.exec ?? ""}:${input.timeout ?? ""}:${input.delay ?? ""}`,
    cacheTtlSeconds: 60,
    schema,
  })
}

export async function fetchBrowserBot(input: {
  url: string
  timeout?: number
  delay?: number
  selector?: string
  exec?: string
}): Promise<BrowserBotResponse> {
  const response = await fetchBrowserBotDetailed(input)
  return response.data
}

