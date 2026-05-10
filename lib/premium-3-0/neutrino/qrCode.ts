import { executeNeutrinoBinaryRequest } from "./client"
import type { NeutrinoResponse } from "./types"

export async function fetchQrCodeDetailed(input: {
  content: string
  width?: number
  height?: number
  fgColor?: string
  bgColor?: string
}): Promise<NeutrinoResponse<ArrayBuffer>> {
  return executeNeutrinoBinaryRequest({
    endpoint: "qr-code",
    operation: "qr-code",
    body: {
      content: input.content,
      width: input.width,
      height: input.height,
      "fg-color": input.fgColor,
      "bg-color": input.bgColor,
    },
    cacheKey: `neutrino:qr-code:${input.content}:${input.width ?? ""}:${input.height ?? ""}:${input.fgColor ?? ""}:${input.bgColor ?? ""}`,
    cacheTtlSeconds: 60 * 60,
  })
}

export async function fetchQrCode(input: {
  content: string
  width?: number
  height?: number
  fgColor?: string
  bgColor?: string
}): Promise<ArrayBuffer> {
  const response = await fetchQrCodeDetailed(input)
  return response.data
}
