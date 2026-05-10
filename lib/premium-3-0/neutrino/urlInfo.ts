import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    url_port: z.number().optional(),
    url_path: z.string().optional(),
    url_query: z.string().optional(),
    url_protocol: z.string().optional(),
    url_host: z.string().optional(),
    is_error: z.boolean().optional(),
    http_status_code: z.number().optional(),
    http_status_message: z.string().optional(),
    content: z.string().optional(),
    mime_type: z.string().optional(),
    title: z.string().optional(),
    load_time: z.number().optional(),
  })
  .passthrough()

export type UrlInfoResponse = z.infer<typeof schema>

export async function fetchUrlInfoDetailed(input: {
  url: string
  fetchContent?: boolean
  ignoreCertificateErrors?: boolean
}): Promise<NeutrinoResponse<UrlInfoResponse>> {
  return executeNeutrinoRequest({
    endpoint: "url-info",
    operation: "url-info",
    body: {
      url: input.url,
      "fetch-content": input.fetchContent,
      "ignore-certificate-errors": input.ignoreCertificateErrors,
    },
    cacheKey: `neutrino:url-info:${input.url}:${input.fetchContent ?? ""}:${input.ignoreCertificateErrors ?? ""}`,
    cacheTtlSeconds: 5 * 60,
    schema,
  })
}

export async function fetchUrlInfo(input: {
  url: string
  fetchContent?: boolean
  ignoreCertificateErrors?: boolean
}): Promise<UrlInfoResponse> {
  const response = await fetchUrlInfoDetailed(input)
  return response.data
}

