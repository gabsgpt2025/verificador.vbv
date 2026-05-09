import { lookupMastercardBin, isLikelyMastercardFamilyBin, type MastercardBinResult } from "@/lib/integrations/mastercard"

import { normalizeNeutrinoBinResponse } from "./normalizeBinApiResponse"
import { callNeutrinoApi } from "./neutrino-api"
import type { SourceDiagnostic } from "./holisticTypes"
import type { BinApiData } from "./types"

export interface MultiSourceResult {
  primary: BinApiData
  sources: {
    neutrino: BinApiData | null
    mastercard: MastercardBinResult | null
    binlist: null
  }
  diagnostics: SourceDiagnostic[]
  consensus: {
    countryAgreement: boolean
    brandAgreement: boolean
    typeAgreement: boolean
    confidence: "HIGH" | "MEDIUM" | "LOW"
    discrepancies: string[]
    sourcesConfirmed: number
    sourcesTotal: number
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

function classifyDiagnosticError(source: SourceDiagnostic["source"], error: unknown): SourceDiagnostic {
  const message = error instanceof Error ? error.message : String(error)
  const lowerMessage = message.toLowerCase()
  const isTimeout = lowerMessage.includes("timeout") || lowerMessage.includes("abort")

  return {
    source,
    status: isTimeout ? "timeout" : "error",
    httpStatus: null,
    latencyMs: null,
    message,
    suggestedAction: isTimeout
      ? "Aguarde alguns segundos e clique em “Tentar novamente”."
      : "Revise credenciais e disponibilidade do provedor.",
  }
}

export async function lookupBinMultiSource(bin: string): Promise<MultiSourceResult> {
  const sanitizedBin = bin.replace(/\D/g, "").slice(0, 8)

  const neutrinoStartedAt = Date.now()
  const mastercardStartedAt = Date.now()

  const [neutrinoLookup, mastercardLookup] = await Promise.allSettled([
    callNeutrinoApi(sanitizedBin).then((response) => normalizeNeutrinoBinResponse(response, sanitizedBin)),
    lookupMastercardBin(sanitizedBin),
  ])

  const neutrino = neutrinoLookup.status === "fulfilled" ? neutrinoLookup.value : null
  const mastercard = mastercardLookup.status === "fulfilled" ? mastercardLookup.value : null

  const mastercardLikelyApplicable = isLikelyMastercardFamilyBin(sanitizedBin)
  const mastercardEnvMissing: string[] = []
  if (!process.env.MASTERCARD_CONSUMER_KEY?.trim()) mastercardEnvMissing.push("MASTERCARD_CONSUMER_KEY")
  if (!process.env.MASTERCARD_PRIVATE_KEY?.trim()) mastercardEnvMissing.push("MASTERCARD_PRIVATE_KEY")

  const diagnostics: SourceDiagnostic[] = []

  if (neutrinoLookup.status === "fulfilled") {
    diagnostics.push({
      source: "neutrino",
      status: neutrino ? "ok" : "error",
      httpStatus: neutrino ? 200 : null,
      latencyMs: Date.now() - neutrinoStartedAt,
      message: neutrino ? "Resposta confirmada." : "Neutrino retornou vazio.",
      suggestedAction: neutrino ? "Sem ação necessária." : "Tente novamente em instantes.",
      lastSuccessAt: neutrino ? new Date().toISOString() : null,
    })
  } else {
    diagnostics.push({
      ...classifyDiagnosticError("neutrino", neutrinoLookup.reason),
      latencyMs: Date.now() - neutrinoStartedAt,
    })
  }

  if (mastercardLookup.status === "fulfilled") {
    if (mastercard) {
      diagnostics.push({
        source: "mastercard",
        status: "ok",
        httpStatus: 200,
        latencyMs: Date.now() - mastercardStartedAt,
        message: "Resposta confirmada.",
        suggestedAction: "Sem ação necessária.",
        lastSuccessAt: new Date().toISOString(),
      })
    } else if (!mastercardLikelyApplicable) {
      diagnostics.push({
        source: "mastercard",
        status: "not_applicable",
        httpStatus: null,
        latencyMs: Date.now() - mastercardStartedAt,
        message: "BIN fora do range Mastercard/Maestro.",
        suggestedAction: "Sem ação necessária para este BIN.",
      })
    } else if (mastercardEnvMissing.length > 0) {
      diagnostics.push({
        source: "mastercard",
        status: "disabled",
        httpStatus: null,
        latencyMs: Date.now() - mastercardStartedAt,
        message: "Integração Mastercard desabilitada por credenciais ausentes.",
        missingEnvVars: mastercardEnvMissing,
        suggestedAction: `Defina ${mastercardEnvMissing.join(", ")} e tente novamente.`,
      })
    } else {
      diagnostics.push({
        source: "mastercard",
        status: "error",
        httpStatus: null,
        latencyMs: Date.now() - mastercardStartedAt,
        message: "Mastercard não respondeu com dados para este BIN.",
        suggestedAction: "Verifique credenciais e limites de rate.",
      })
    }
  } else {
    diagnostics.push({
      ...classifyDiagnosticError("mastercard", mastercardLookup.reason),
      latencyMs: Date.now() - mastercardStartedAt,
      missingEnvVars: mastercardEnvMissing.length > 0 ? mastercardEnvMissing : undefined,
    })
  }

  diagnostics.push({
    source: "binlist",
    status: "disabled",
    httpStatus: null,
    latencyMs: null,
    message: "BinList não está habilitado no endpoint canônico /api/bin-analysis-v2.",
    suggestedAction: "Use integração canônica (Neutrino/Mastercard) ou habilite BinList na camada de backend.",
  })

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

  const sourcesConfirmed = [neutrino, mastercard, null].filter(Boolean).length
  const sourcesTotal = 3

  return {
    primary: buildPrimaryBinData(sanitizedBin, neutrino, mastercard),
    sources: {
      neutrino,
      mastercard,
      binlist: null,
    },
    diagnostics,
    consensus: {
      countryAgreement,
      brandAgreement,
      typeAgreement,
      confidence,
      discrepancies,
      sourcesConfirmed,
      sourcesTotal,
    },
  }
}
