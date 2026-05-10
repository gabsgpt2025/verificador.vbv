import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    valid: z.boolean().optional(),
    disposable: z.boolean().optional(),
    role: z.boolean().optional(),
    free: z.boolean().optional(),
    syntax_error: z.boolean().optional(),
    domain: z.string().optional(),
    provider: z.string().optional(),
    is_freemail: z.boolean().optional(),
    typos_fixed: z.boolean().optional(),
    fix_address: z.string().optional(),
  })
  .passthrough()

export type EmailValidateResponse = z.infer<typeof schema>

export async function fetchEmailValidateDetailed(input: { email: string }): Promise<NeutrinoResponse<EmailValidateResponse>> {
  return executeNeutrinoRequest({
    endpoint: "email-validate",
    operation: "email-validate",
    body: { email: input.email },
    cacheKey: `neutrino:email-validate:${input.email.toLowerCase()}`,
    cacheTtlSeconds: 24 * 60 * 60,
    schema,
  })
}

export async function fetchEmailValidate(input: { email: string }): Promise<EmailValidateResponse> {
  const response = await fetchEmailValidateDetailed(input)
  return response.data
}
