import { lookupMastercardBin, isLikelyMastercardFamilyBin, type MastercardBinResult } from "@/lib/integrations/mastercard"

import { normalizeNeutrinoBinResponse } from "./normalizeBinApiResponse"
import { callNeutrinoApi } from "./neutrino-api"
import type { BinApiData } from "./types"

export interface MultiSourceResult {
  primary: BinApiData
  sources: {
    neutrino: BinApiData | null
    mastercard: MastercardBinResult | null
  }
  consensus: {
    countryAgreement: boolean
    brandAgreement: boolean
    typeAgreement: boolean
    confidence: "HIGH" | "MEDIUM" | "LOW"
    discrepancies: string[]
  }
}

function normalizeCountry(value?: string | null) {
  if (!value) return null
  const normalized = value.trim().toUpperCase()
  return normalized.length >= 2 ? normalized.slice(0, 2) : normalized
}

function normalizeValue(value?: string | null) {
  const normalized = value?.trim().toUpperCase()
  return normalized ? normalized : null
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function convertMastercardToBinApiData(result: MastercardBinResult): BinApiData {
  return {
    bin: result.bin,
    binLength: result.binLength,
    brand: result.brand === "UNKNOWN" ? undefined : result.brand,
    type: result.cardType,
    category: result.productName || result.productCode || result.productCategory,
    countryCode: normalizeCountry(result.countryCode) ?? undefined,
    countryName: result.countryName || undefined,
    issuer: result.issuerName || null,
    isCommercial: result.productCategory === "COMMERCIAL",
    isPrepaid: result.cardType === "PREPAID" || result.productCategory === "PREPAID",
    source: "MASTERCARD",
    raw: result.raw,
  }
}

function pickFirstString(sources: Array<BinApiData | null>, selector: (value: BinApiData) => string | null | undefined) {
  for (const source of sources) {
    if (!source) continue
    const selected = selector(source)
    if (isNonEmptyString(selected)) {
      return selected
    }
  }

  return undefined
}

function pickFirstBoolean(sources: Array<BinApiData | null>, selector: (value: BinApiData) => boolean | undefined) {
  for (const source of sources) {
    if (!source) continue
    const selected = selector(source)
    if (typeof selected === "boolean") {
      return selected
    }
  }

  return undefined
}

function pickFirstNumber(sources: Array<BinApiData | null>, selector: (value: BinApiData) => number | undefined) {
  for (const source of sources) {
    if (!source) continue
    const selected = selector(source)
    if (typeof selected === "number") {
      return selected
    }
  }

  return undefined
}

function buildPrimaryBinData(bin: string, neutrino: BinApiData | null, mastercard: MastercardBinResult | null) {
  const mastercardAsBin = mastercard ? convertMastercardToBinApiData(mastercard) : null
  const preferredSources = isLikelyMastercardFamilyBin(bin)
    ? [mastercardAsBin, neutrino]
    : [neutrino, mastercardAsBin]

  const primaryProvider = preferredSources.find(Boolean)?.source ?? "UNKNOWN"

  return {
    bin,
    binLength: pickFirstNumber(preferredSources, (source) => source.binLength) ?? bin.length,
    brand: pickFirstString(preferredSources, (source) => source.brand),
    type: pickFirstString(preferredSources, (source) => source.type),
    category: pickFirstString(preferredSources, (source) => source.category),
    countryCode: pickFirstString(preferredSources, (source) => source.countryCode),
    countryName: pickFirstString(preferredSources, (source) => source.countryName),
    currency: pickFirstString(preferredSources, (source) => source.currency),
    issuer: pickFirstString(preferredSources, (source) => source.issuer) ?? null,
    issuerWebsite: pickFirstString(preferredSources, (source) => source.issuerWebsite) ?? null,
    issuerPhone: pickFirstString(preferredSources, (source) => source.issuerPhone) ?? null,
    isCommercial: pickFirstBoolean(preferredSources, (source) => source.isCommercial),
    isPrepaid: pickFirstBoolean(preferredSources, (source) => source.isPrepaid),
    source: primaryProvider,
    raw: {
      neutrino: neutrino?.raw ?? null,
      mastercard: mastercard?.raw ?? null,
    },
  } satisfies BinApiData
}

function compareField(
  label: string,
  neutrinoValue: string | null,
  mastercardValue: string | null,
  discrepancies: string[],
) {
  if (!neutrinoValue || !mastercardValue) {
    return false
  }

  if (neutrinoValue !== mastercardValue) {
    discrepancies.push(`${label} mismatch: Neutrino=${neutrinoValue}, Mastercard=${mastercardValue}`)
    return false
  }

  return true
}

export async function lookupBinMultiSource(bin: string): Promise<MultiSourceResult> {
  const sanitizedBin = bin.replace(/\D/g, "").slice(0, 8)

  const [neutrinoLookup, mastercardLookup] = await Promise.allSettled([
    callNeutrinoApi(sanitizedBin).then((response) => normalizeNeutrinoBinResponse(response, sanitizedBin)),
    lookupMastercardBin(sanitizedBin),
  ])

  const neutrino = neutrinoLookup.status === "fulfilled" ? neutrinoLookup.value : null
  const mastercard = mastercardLookup.status === "fulfilled" ? mastercardLookup.value : null

  if (!neutrino && !mastercard) {
    const reason =
      neutrinoLookup.status === "rejected"
        ? neutrinoLookup.reason
        : mastercardLookup.status === "rejected"
          ? mastercardLookup.reason
          : new Error("No BIN sources available")
    throw reason instanceof Error ? reason : new Error(String(reason))
  }

  const discrepancies: string[] = []
  const countryAgreement = compareField(
    "country",
    normalizeCountry(neutrino?.countryCode),
    normalizeCountry(mastercard?.countryCode),
    discrepancies,
  )
  const brandAgreement = compareField(
    "brand",
    normalizeValue(neutrino?.brand),
    normalizeValue(mastercard?.brand),
    discrepancies,
  )
  const typeAgreement = compareField(
    "type",
    normalizeValue(neutrino?.type),
    normalizeValue(mastercard?.cardType),
    discrepancies,
  )

  const confidence: MultiSourceResult["consensus"]["confidence"] =
    neutrino && mastercard
      ? discrepancies.length === 0
        ? "HIGH"
        : discrepancies.length === 1
          ? "MEDIUM"
          : "LOW"
      : "LOW"

  return {
    primary: buildPrimaryBinData(sanitizedBin, neutrino, mastercard),
    sources: {
      neutrino,
      mastercard,
    },
    consensus: {
      countryAgreement,
      brandAgreement,
      typeAgreement,
      confidence,
      discrepancies,
    },
  }
}
