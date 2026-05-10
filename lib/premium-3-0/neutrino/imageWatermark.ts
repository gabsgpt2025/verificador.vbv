import { executeNeutrinoBinaryRequest } from "./client"
import type { NeutrinoResponse } from "./types"

export async function fetchImageWatermarkDetailed(input: {
  imageUrl: string
  watermarkUrl: string
  opacity?: number
  format?: string
  position?: string
  width?: number
  height?: number
}): Promise<NeutrinoResponse<ArrayBuffer>> {
  return executeNeutrinoBinaryRequest({
    endpoint: "image-watermark",
    operation: "image-watermark",
    body: {
      "image-url": input.imageUrl,
      "watermark-url": input.watermarkUrl,
      opacity: input.opacity,
      format: input.format,
      position: input.position,
      width: input.width,
      height: input.height,
    },
    cacheKey: `neutrino:image-watermark:${input.imageUrl}:${input.watermarkUrl}:${input.opacity ?? ""}:${input.format ?? ""}:${input.position ?? ""}:${input.width ?? ""}:${input.height ?? ""}`,
    cacheTtlSeconds: 60 * 60,
  })
}

export async function fetchImageWatermark(input: {
  imageUrl: string
  watermarkUrl: string
  opacity?: number
  format?: string
  position?: string
  width?: number
  height?: number
}): Promise<ArrayBuffer> {
  const response = await fetchImageWatermarkDetailed(input)
  return response.data
}

