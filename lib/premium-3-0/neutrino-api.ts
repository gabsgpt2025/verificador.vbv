/**
 * Neutrino API Integration for BIN Lookup
 * https://www.neutrinoapi.net/
 */

import { getNeutrinoCredentials } from "@/lib/env"

export interface NeutrinoResponse {
  bin?: string
  valid?: boolean
  card_brand?: string
  card_type?: string
  card_category?: string
  issuer_name?: string
  issuer_website?: string
  issuer_phone?: string
  country_code?: string
  country_name?: string
  country_iso3?: string
  country_continent?: string
  country_population?: number
  currency_code?: string
  currency_name?: string
  is_commercial?: boolean
  is_prepaid?: boolean
  is_3d_secure?: boolean
  risk_level?: string
  [key: string]: unknown
}

const NEUTRINO_BASE_URL = "https://neutrinoapi.net/bin-lookup"
const NEUTRINO_TIMEOUT_MS = 8000
const NEUTRINO_MAX_RETRIES = 3
const NEUTRINO_RETRY_BASE_MS = 300
const NEUTRINO_MIN_INTERVAL_MS = 120

let lastNeutrinoRequestAt = 0

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

export async function callNeutrinoApi(bin: string): Promise<NeutrinoResponse> {
  const { apiKey, userId } = getNeutrinoCredentials()
  const sanitizedBin = bin.replace(/\s/g, "").substring(0, 8)

  for (let attempt = 1; attempt <= NEUTRINO_MAX_RETRIES; attempt++) {
    try {
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
        const isRetryable = response.status === 429 || response.status >= 500
        if (isRetryable && attempt < NEUTRINO_MAX_RETRIES) {
          await sleep(NEUTRINO_RETRY_BASE_MS * 2 ** (attempt - 1))
          continue
        }

        console.error(`[Neutrino] API error ${response.status}`)
        throw new Error(`Neutrino API error: ${response.status} - ${errorText}`)
      }

      const data: NeutrinoResponse = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error && /^Neutrino API error: 4\d{2}/.test(error.message)) {
        throw error
      }

      const isFinalAttempt = attempt === NEUTRINO_MAX_RETRIES
      if (isFinalAttempt) {
        console.error(`[Neutrino] Request failed after ${attempt} attempt(s)`)
        throw error
      }

      await sleep(NEUTRINO_RETRY_BASE_MS * 2 ** (attempt - 1))
    }
  }

  throw new Error("Neutrino API request failed")
}

/**
 * Converts Neutrino API response to internal BIN data format
 */
export function convertNeutrinoResponse(data: NeutrinoResponse): Record<string, unknown> {
  return {
    bin: data.bin,
    valid: data.valid ?? false,
    brand: data.card_brand || "UNKNOWN",
    type: data.card_type || "UNKNOWN",
    category: data.card_category || null,
    issuer: data.issuer_name || null,
    issuerWebsite: data.issuer_website || null,
    issuerPhone: data.issuer_phone || null,
    countryCode: data.country_code || null,
    countryName: data.country_name || null,
    countryIso3: data.country_iso3 || null,
    countryContinent: data.country_continent || null,
    countryPopulation: data.country_population || null,
    currency: data.currency_code || null,
    currencyName: data.currency_name || null,
    isCommercial: data.is_commercial ?? false,
    isPrepaid: data.is_prepaid ?? false,
    is3dSecure: data.is_3d_secure ?? false,
    riskLevel: data.risk_level || "UNKNOWN",
  }
}
