import { executeNeutrinoBinaryRequest } from "./client"
import type { NeutrinoResponse } from "./types"

export async function fetchHtmlRenderDetailed(input: {
  content: string
  format?: "pdf" | "png" | "jpg"
  pageSize?: "A4" | "Letter"
  title?: string
  margin?: number
  landscape?: boolean
  zoom?: number
}): Promise<NeutrinoResponse<ArrayBuffer>> {
  return executeNeutrinoBinaryRequest({
    endpoint: "html-render",
    operation: "html-render",
    body: {
      content: input.content,
      format: input.format,
      "page-size": input.pageSize,
      title: input.title,
      margin: input.margin,
      landscape: input.landscape,
      zoom: input.zoom,
    },
    cacheKey: `neutrino:html-render:${input.content}:${input.format ?? ""}:${input.pageSize ?? ""}:${input.title ?? ""}:${input.margin ?? ""}:${input.landscape ?? ""}:${input.zoom ?? ""}`,
    cacheTtlSeconds: 5 * 60,
  })
}

export async function fetchHtmlRender(input: {
  content: string
  format?: "pdf" | "png" | "jpg"
  pageSize?: "A4" | "Letter"
  title?: string
  margin?: number
  landscape?: boolean
  zoom?: number
}): Promise<ArrayBuffer> {
  const response = await fetchHtmlRenderDetailed(input)
  return response.data
}

