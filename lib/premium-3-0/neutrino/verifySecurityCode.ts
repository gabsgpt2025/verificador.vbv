import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    verified: z.boolean().optional(),
  })
  .passthrough()

export type VerifySecurityCodeResponse = z.infer<typeof schema>

export async function fetchVerifySecurityCodeDetailed(input: {
  securityCode: string
  limitBy?: string
}): Promise<NeutrinoResponse<VerifySecurityCodeResponse>> {
  return executeNeutrinoRequest({
    endpoint: "verify-security-code",
    operation: "verify-security-code",
    body: {
      "security-code": input.securityCode,
      "limit-by": input.limitBy,
    },
    cacheKey: `neutrino:verify-security-code:${input.securityCode}:${input.limitBy ?? ""}`,
    cacheTtlSeconds: 0,
    schema,
  })
}

export async function fetchVerifySecurityCode(input: {
  securityCode: string
  limitBy?: string
}): Promise<VerifySecurityCodeResponse> {
  const response = await fetchVerifySecurityCodeDetailed(input)
  return response.data
}

