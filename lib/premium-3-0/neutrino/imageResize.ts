import { executeNeutrinoBinaryRequest } from "./client"
import type { NeutrinoResponse } from "./types"

export async function fetchImageResizeDetailed(input: {
  imageUrl: string
  width: number
  height: number
  format?: "png" | "jpg" | "gif"
}): Promise<NeutrinoResponse<ArrayBuffer>> {
  return executeNeutrinoBinaryRequest({
    endpoint: "image-resize",
    operation: "image-resize",
    body: {
      "image-url": input.imageUrl,
      width: input.width,
      height: input.height,
      format: input.format,
    },
    cacheKey: `neutrino:image-resize:${input.imageUrl}:${input.width}:${input.height}:${input.format ?? ""}`,
    cacheTtlSeconds: 60 * 60,
  })
}

export async function fetchImageResize(input: {
  imageUrl: string
  width: number
  height: number
  format?: "png" | "jpg" | "gif"
}): Promise<ArrayBuffer> {
  const response = await fetchImageResizeDetailed(input)
  return response.data
}

