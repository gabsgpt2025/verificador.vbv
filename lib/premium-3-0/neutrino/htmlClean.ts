import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    output: z.string().optional(),
  })
  .passthrough()

export type HtmlCleanResponse = z.infer<typeof schema>

export async function fetchHtmlCleanDetailed(input: {
  content: string
  outputType?: "plain-text" | "simple-html"
}): Promise<NeutrinoResponse<HtmlCleanResponse>> {
  return executeNeutrinoRequest({
    endpoint: "html-clean",
    operation: "html-clean",
    body: {
      content: input.content,
      "output-type": input.outputType,
    },
    cacheKey: `neutrino:html-clean:${input.outputType ?? ""}:${input.content}`,
    cacheTtlSeconds: 5 * 60,
    schema,
  })
}

export async function fetchHtmlClean(input: {
  content: string
  outputType?: "plain-text" | "simple-html"
}): Promise<HtmlCleanResponse> {
  const response = await fetchHtmlCleanDetailed(input)
  return response.data
}

