/**
 * Neutrino API Integration for BIN Lookup
 * https://www.neutrinoapi.net/
 */

import { z } from "zod"
import { getNeutrinoCredentials } from "@/lib/env"
import { resilientFetch } from "@/lib/premium-3-0/runtime/resilientFetch"
import type { NeutrinoBinResponse } from "@/lib/premium-3-0/types"

const NEUTRINO_BASE_URL = "https://neutrinoapi.net/bin-lookup"
const NEUTRINO_TIMEOUT_MS = 4000
const NEUTRINO_RETRY_BASE_MS = 300
const NEUTRINO_MIN_INTERVAL_MS = 120
const NEUTRINO_CACHE_TTL_SECONDS = 7 * 24 * 3600

let lastNeutrinoRequestAt = 0

const neutrinoBinResponseSchema = z
  .object({
    bin: z.string().optional(),
    valid: z.boolean().optional(),
    card_brand: z.string().optional(),
    card_type: z.string().optional(),
    card_category: z.string().optional(),
    issuer_name: z.string().optional(),
    issuer_website: z.string().optional(),
    issuer_phone: z.string().optional(),
    country_code: z.string().optional(),
    country_name: z.string().optional(),
    country_iso3: z.string().optional(),
    country_continent: z.string().optional(),
    country_population: z.number().optional(),
    currency_code: z.string().optional(),
    currency_name: z.string().optional(),
    is_commercial: z.boolean().optional(),
    is_prepaid: z.boolean().optional(),
    is_3d_secure: z.boolean().optional(),
    risk_level: z.string().optional(),
  })
  .passthrough()

class NeutrinoApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "NeutrinoApiError"
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function throttleNeutrinoCalls() {
  const now = Date.now()
  const waitMs = Math.max(0, lastNeutrinoRequestAt + NEUTRINO_MIN_INTERVAL_MS - now)
  if (waitMs > 0) {
    await sleep(waitMs)
  }
  lastNeutrinoRequestAt = Date.now()
}

export async function callNeutrinoApi(bin: string): Promise<NeutrinoBinResponse> {
  const { apiKey, userId } = getNeutrinoCredentials()
  const sanitizedBin = bin.replace(/\s/g, "").substring(0, 8)

  try {
    const { data } = await resilientFetch(
      async () => {
        await throttleNeutrinoCalls()

        const response = await fetch(NEUTRINO_BASE_URL, {
          method: "POST",
          headers: {
            "User-ID": userId,
            "API-Key": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "bin-number": sanitizedBin,
          }).toString(),
          signal: AbortSignal.timeout(NEUTRINO_TIMEOUT_MS),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[Neutrino] API error ${response.status}`)
          throw new NeutrinoApiError(response.status, `Neutrino API error: ${response.status} - ${errorText}`)
        }

        return response.json()
      },
      {
        providerName: "neutrino",
        operation: "bin-lookup",
        cacheKey: `neutrino:bin-lookup:${sanitizedBin}`,
        cacheTtlSeconds: NEUTRINO_CACHE_TTL_SECONDS,
        breakerOptions: {
          name: "neutrino:bin-lookup",
          failureThreshold: 5,
          timeoutMs: NEUTRINO_TIMEOUT_MS,
        },
        retryOptions: {
          maxAttempts: 2,
          baseDelayMs: NEUTRINO_RETRY_BASE_MS,
          jitter: false,
        },
        parse: (raw) => neutrinoBinResponseSchema.parse(raw) as NeutrinoBinResponse,
      },
    )

    return data
  } catch (error) {
    if (error instanceof NeutrinoApiError && error.status >= 400 && error.status < 500) {
      throw error
    }

    console.error("[Neutrino] Request failed")
    throw error
  }
}
