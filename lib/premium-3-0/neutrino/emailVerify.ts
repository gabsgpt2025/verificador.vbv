import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    valid: z.boolean().optional(),
    verified: z.boolean().optional(),
    is_freemail: z.boolean().optional(),
    is_disposable: z.boolean().optional(),
    is_role: z.boolean().optional(),
    is_mailbox_full: z.boolean().optional(),
    is_catch_all: z.boolean().optional(),
    domain: z.string().optional(),
    provider: z.string().optional(),
    smtp_response: z.string().optional(),
    smtp_status: z.string().optional(),
    typos_fixed: z.boolean().optional(),
    fix_address: z.string().optional(),
  })
  .passthrough()

export type EmailVerifyResponse = z.infer<typeof schema>

export async function fetchEmailVerifyDetailed(input: { email: string; fixTypos?: boolean }): Promise<NeutrinoResponse<EmailVerifyResponse>> {
  return executeNeutrinoRequest({
    endpoint: "email-verify",
    operation: "email-verify",
    body: {
      email: input.email,
      "fix-typos": input.fixTypos,
    },
    cacheKey: `neutrino:email-verify:${input.email.toLowerCase()}:${input.fixTypos ?? ""}`,
    cacheTtlSeconds: 60 * 60,
    schema,
  })
}

export async function fetchEmailVerify(input: { email: string; fixTypos?: boolean }): Promise<EmailVerifyResponse> {
  const response = await fetchEmailVerifyDetailed(input)
  return response.data
}

