/**
 * Neutrino API Integration for BIN Lookup
 * https://www.neutrinoapi.net/
 */

import { getNeutrinoCredentials } from "@/lib/env"
import type { NeutrinoBinResponse } from "@/lib/premium-3-0/types"

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

export async function callNeutrinoApi(bin: string): Promise<NeutrinoBinResponse> {
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

      const data: NeutrinoBinResponse = await response.json()
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
