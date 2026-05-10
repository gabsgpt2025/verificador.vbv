import { z } from "zod"
import { executeNeutrinoRequest } from "./client"
import type { NeutrinoResponse } from "./types"

const schema = z
  .object({
    valid: z.boolean().optional(),
    from_value: z.number().optional(),
    from_type: z.string().optional(),
    to_value: z.number().optional(),
    to_type: z.string().optional(),
    exchange_rate: z.number().optional(),
  })
  .passthrough()

export type CurrencyConvertResponse = z.infer<typeof schema>

export async function fetchCurrencyConvertDetailed(input: {
  fromValue: string | number
  fromType: string
  toType: string
}): Promise<NeutrinoResponse<CurrencyConvertResponse>> {
  return executeNeutrinoRequest({
    endpoint: "currency-convert",
    operation: "currency-convert",
    body: {
      "from-value": input.fromValue,
      "from-type": input.fromType,
      "to-type": input.toType,
    },
    cacheKey: `neutrino:currency-convert:${input.fromValue}:${input.fromType}:${input.toType}`,
    cacheTtlSeconds: 5 * 60,
    schema,
  })
}

export async function fetchCurrencyConvert(input: {
  fromValue: string | number
  fromType: string
  toType: string
}): Promise<CurrencyConvertResponse> {
  const response = await fetchCurrencyConvertDetailed(input)
  return response.data
}
