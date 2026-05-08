import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

import { getCache } from "@/lib/premium-3-0/runtime/cache"

import { loadPrivateKeyFromEnv, signRequest } from "./oauthSigner"
import type { MastercardBinLookupApiResponse, MastercardBinLookupAccountRange, MastercardBinResult } from "./types"

const MASTERCARD_DEFAULT_BASE_URL = "https://sandbox.api.mastercard.com"
const MASTERCARD_CACHE_TTL_SECONDS = 24 * 60 * 60
const MASTERCARD_REQUEST_TIMEOUT_MS = 5_000
const MASTERCARD_RETRY_DELAY_MS = 500
const MASTERCARD_CACHE_KEY_PREFIX = "mastercard:bin-lookup:"

let disabledLogged = false
let supabaseCacheClient: SupabaseClient | null | undefined

type CachedMastercardLookup =
  | { found: true; value: MastercardBinResult }
  | { found: false }

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function maskBin(bin: string) {
  const sanitized = bin.replace(/\D/g, "")
  if (sanitized.length <= 2) {
    return `${sanitized.slice(0, 1)}**`
  }

  return `${sanitized.slice(0, Math.min(4, sanitized.length))}**`
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeBrand(value: string): MastercardBinResult["brand"] {
  const normalized = value.toUpperCase()
  if (normalized.includes("MAESTRO")) return "MAESTRO"
  if (normalized.includes("CIRRUS")) return "CIRRUS"
  if (normalized.includes("MASTER")) return "MASTERCARD"
  return "UNKNOWN"
}

function normalizeProductCategory(value: string): MastercardBinResult["productCategory"] {
  const normalized = value.toUpperCase()
  if (normalized.includes("PREPAID")) return "PREPAID"
  if (normalized.includes("COMMERCIAL") || normalized.includes("BUSINESS") || normalized.includes("CORPORATE")) {
    return "COMMERCIAL"
  }

  return "CONSUMER"
}

function normalizeCardType(value: string, productCategory: MastercardBinResult["productCategory"]): MastercardBinResult["cardType"] {
  const normalized = value.toUpperCase()
  if (normalized.includes("PREPAID") || productCategory === "PREPAID") return "PREPAID"
  if (normalized.includes("DEBIT")) return "DEBIT"
  if (normalized.includes("CHARGE")) return "CHARGE"
  return "CREDIT"
}

function parseNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function unwrapPayload(raw: unknown): MastercardBinLookupApiResponse {
  if (!raw || typeof raw !== "object") {
    return {}
  }

  const payload = raw as MastercardBinLookupApiResponse
  if (payload.data && typeof payload.data === "object") {
    return payload.data
  }

  return payload
}

function pickAccountRange(payload: MastercardBinLookupApiResponse): MastercardBinLookupAccountRange | undefined {
  return Array.isArray(payload.accountRanges) && payload.accountRanges.length > 0 ? payload.accountRanges[0] : undefined
}

function normalizeMastercardResponse(bin: string, raw: unknown): MastercardBinResult {
  const payload = unwrapPayload(raw)
  const accountRange = pickAccountRange(payload)

  const brandValue =
    normalizeString(accountRange?.brand) ||
    normalizeString(payload.brand) ||
    normalizeString(accountRange?.acceptanceBrand) ||
    normalizeString(payload.acceptanceBrand)

  const productCategory = normalizeProductCategory(
    normalizeString(accountRange?.productCategory) ||
      normalizeString(payload.productCategory) ||
      normalizeString(accountRange?.consumerOrCommercial) ||
      normalizeString(payload.consumerOrCommercial),
  )

  const cardType = normalizeCardType(
    normalizeString(accountRange?.cardType) || normalizeString(payload.cardType) || normalizeString(payload.productName),
    productCategory,
  )

  return {
    bin,
    binLength: parseNumber(accountRange?.panLength ?? payload.binLength, bin.length),
    brand: normalizeBrand(brandValue),
    productCode: normalizeString(accountRange?.productCode) || normalizeString(payload.productCode),
    productName: normalizeString(accountRange?.productName) || normalizeString(payload.productName),
    productCategory,
    cardType,
    countryCode: normalizeString(accountRange?.countryCode) || normalizeString(payload.countryCode),
    countryName: normalizeString(accountRange?.countryName) || normalizeString(payload.countryName),
    issuerName: normalizeString(accountRange?.issuerName) || normalizeString(payload.issuerName),
    issuerCountry: normalizeString(accountRange?.issuerCountry) || normalizeString(payload.issuerCountry),
    acceptanceBrand:
      normalizeString(accountRange?.acceptanceBrand) || normalizeString(payload.acceptanceBrand) || brandValue.toUpperCase(),
    source: "MASTERCARD",
    raw,
  }
}

function getSupabaseCacheClient() {
  if (supabaseCacheClient !== undefined) {
    return supabaseCacheClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    supabaseCacheClient = null
    return supabaseCacheClient
  }

  supabaseCacheClient = createSupabaseClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseCacheClient
}

async function readSupabaseCache(bin: string) {
  const client = getSupabaseCacheClient()
  if (!client) {
    return null
  }

  try {
    const { data, error } = await client
      .from("mastercard_bin_cache")
      .select("data, expires_at")
      .eq("bin", bin)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (error || !data?.data) {
      return null
    }

    return data.data as MastercardBinResult
  } catch {
    return null
  }
}

async function writeSupabaseCache(result: MastercardBinResult) {
  const client = getSupabaseCacheClient()
  if (!client) {
    return
  }

  try {
    await client.from("mastercard_bin_cache").upsert({
      bin: result.bin,
      data: result,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + MASTERCARD_CACHE_TTL_SECONDS * 1_000).toISOString(),
    })
  } catch {
    // Supabase cache is optional and should never break BIN lookup.
  }
}

function getMastercardConfig() {
  const consumerKey = process.env.MASTERCARD_CONSUMER_KEY?.trim()
  const privateKeyPem = loadPrivateKeyFromEnv()
  const apiBase = (process.env.MASTERCARD_API_BASE?.trim() || MASTERCARD_DEFAULT_BASE_URL).replace(/\/+$/, "")

  if (!consumerKey || !privateKeyPem) {
    if (!disabledLogged) {
      console.info("[MASTERCARD] Client disabled: missing MASTERCARD_CONSUMER_KEY or MASTERCARD_PRIVATE_KEY")
      disabledLogged = true
    }

    return null
  }

  return { consumerKey, privateKeyPem, apiBase }
}

export function isLikelyMastercardFamilyBin(bin: string) {
  const sanitized = bin.replace(/\D/g, "")
  if (sanitized.length < 2) {
    return false
  }

  const firstTwo = Number.parseInt(sanitized.slice(0, 2), 10)
  const firstFour = Number.parseInt(sanitized.slice(0, 4), 10)

  return (
    (firstTwo >= 51 && firstTwo <= 55) ||
    (firstFour >= 2221 && firstFour <= 2720) ||
    firstTwo === 50 ||
    (firstTwo >= 56 && firstTwo <= 59) ||
    sanitized.startsWith("67") ||
    sanitized.startsWith("6")
  )
}

async function fetchMastercardBin(bin: string, config: NonNullable<ReturnType<typeof getMastercardConfig>>) {
  const url = `${config.apiBase}/bin-resources/bins/${encodeURIComponent(bin)}`

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), MASTERCARD_REQUEST_TIMEOUT_MS)

    try {
      const { authorizationHeader } = signRequest({
        consumerKey: config.consumerKey,
        privateKeyPem: config.privateKeyPem,
        method: "GET",
        url,
      })

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authorizationHeader,
          Accept: "application/json",
        },
        signal: controller.signal,
      })

      if (response.status === 404) {
        return null
      }

      if (response.status === 401 || response.status === 403) {
        console.error("[MASTERCARD] Authorization failed", { status: response.status, bin: maskBin(bin) })
        return null
      }

      if (response.status >= 500) {
        if (attempt < 2) {
          await sleep(MASTERCARD_RETRY_DELAY_MS)
          continue
        }

        console.error("[MASTERCARD] Upstream server error", { status: response.status, bin: maskBin(bin) })
        return null
      }

      if (!response.ok) {
        console.error("[MASTERCARD] Unexpected response", { status: response.status, bin: maskBin(bin) })
        return null
      }

      return normalizeMastercardResponse(bin, (await response.json()) as unknown)
    } catch (error) {
      if (attempt < 2) {
        await sleep(MASTERCARD_RETRY_DELAY_MS)
        continue
      }

      console.error("[MASTERCARD] Request failed", {
        bin: maskBin(bin),
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    } finally {
      clearTimeout(timeout)
    }
  }

  return null
}

export async function lookupMastercardBin(bin: string): Promise<MastercardBinResult | null> {
  const sanitizedBin = bin.replace(/\D/g, "").slice(0, 8)
  if (!sanitizedBin || !isLikelyMastercardFamilyBin(sanitizedBin)) {
    return null
  }

  const config = getMastercardConfig()
  if (!config) {
    return null
  }

  const cache = getCache()
  const cacheKey = `${MASTERCARD_CACHE_KEY_PREFIX}${sanitizedBin}`
  const cached = await cache.get<CachedMastercardLookup>(cacheKey)
  if (cached) {
    return cached.found ? cached.value : null
  }

  const supabaseCached = await readSupabaseCache(sanitizedBin)
  if (supabaseCached) {
    await cache.set(cacheKey, { found: true, value: supabaseCached }, MASTERCARD_CACHE_TTL_SECONDS)
    return supabaseCached
  }

  const result = await fetchMastercardBin(sanitizedBin, config)
  if (!result) {
    await cache.set(cacheKey, { found: false }, MASTERCARD_CACHE_TTL_SECONDS)
    return null
  }

  await cache.set(cacheKey, { found: true, value: result }, MASTERCARD_CACHE_TTL_SECONDS)
  await writeSupabaseCache(result)

  return result
}
