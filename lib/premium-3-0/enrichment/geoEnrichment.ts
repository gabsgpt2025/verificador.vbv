import type { BinRiskFactor } from "../types"

export type CountryRiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export const COUNTRY_RISK_TIER: Record<string, CountryRiskTier> = {
  US: "LOW",
  BR: "LOW",
  GB: "LOW",
  DE: "LOW",
  FR: "LOW",
  ES: "LOW",
  IT: "LOW",
  NL: "LOW",
  JP: "LOW",
  AU: "LOW",
  CA: "LOW",
  MX: "LOW",
  PT: "LOW",
  SE: "LOW",
  NO: "LOW",
  FI: "LOW",
  DK: "LOW",
  CH: "LOW",
  SG: "LOW",
  IE: "LOW",
  AR: "MEDIUM",
  BO: "MEDIUM",
  ZW: "MEDIUM",
  CN: "MEDIUM",
  IN: "MEDIUM",
  TR: "MEDIUM",
  ZA: "MEDIUM",
  EG: "MEDIUM",
  NG: "HIGH",
  VE: "HIGH",
  PK: "HIGH",
  BD: "HIGH",
  KE: "HIGH",
  GH: "HIGH",
  RU: "CRITICAL",
  IR: "CRITICAL",
  KP: "CRITICAL",
  BY: "CRITICAL",
  UA: "CRITICAL",
}

const BASE_SCORE_BY_TIER: Record<CountryRiskTier, number> = {
  LOW: 15,
  MEDIUM: 35,
  HIGH: 55,
  CRITICAL: 80,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function normalizeCountryCode(countryCode?: string | null) {
  if (!countryCode) return null
  const normalized = countryCode.trim().toUpperCase()
  return normalized.length >= 2 ? normalized.slice(0, 2) : null
}

function getHeaderValue(headers: Headers | Record<string, string | null | undefined>, key: string) {
  if (headers instanceof Headers) {
    return headers.get(key)
  }

  const exact = headers[key]
  if (typeof exact === "string") return exact

  const lower = headers[key.toLowerCase()]
  return typeof lower === "string" ? lower : null
}

export function extractGeoFromHeaders(headers: Headers | Record<string, string | null | undefined>) {
  const forwardedFor = getHeaderValue(headers, "x-forwarded-for")
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? null
  const ipCountry =
    normalizeCountryCode(getHeaderValue(headers, "x-vercel-ip-country")) ??
    normalizeCountryCode(getHeaderValue(headers, "cf-ipcountry"))
  const ipRegion = getHeaderValue(headers, "x-vercel-ip-country-region")?.trim() ?? null

  return {
    ipAddress,
    ipCountry,
    ipRegion,
  }
}

export function getCountryRiskTier(countryCode?: string | null): CountryRiskTier {
  const normalized = normalizeCountryCode(countryCode)
  if (!normalized) return "MEDIUM"
  return COUNTRY_RISK_TIER[normalized] ?? "MEDIUM"
}

export function enrichGeo(
  binCountryCode?: string | null,
  ipAddress?: string | null,
  ipCountryCode?: string | null,
) {
  const binCountry = normalizeCountryCode(binCountryCode)
  const ipCountry = normalizeCountryCode(ipCountryCode)
  const countryRiskTier = getCountryRiskTier(binCountry)
  const factors: BinRiskFactor[] = []
  let score = binCountry ? BASE_SCORE_BY_TIER[countryRiskTier] : 30

  if (binCountry) {
    factors.push({
      label: `Tier geográfico do BIN: ${countryRiskTier}`,
      impact: BASE_SCORE_BY_TIER[countryRiskTier] - 20,
      reason: `País emissor ${binCountry} classificado como ${countryRiskTier}.`,
    })
  } else {
    factors.push({
      label: "País emissor indisponível",
      impact: 0,
      reason: "Sem país do BIN, a dimensão geográfica opera em baseline neutro.",
    })
  }

  const ipCountryMatch = Boolean(binCountry && ipCountry && binCountry === ipCountry)

  if (binCountry && ipCountry && !ipCountryMatch) {
    score += 25
    factors.push({
      label: "Divergência BIN vs IP",
      impact: 25,
      reason: `BIN em ${binCountry}, IP em ${ipCountry} (${ipAddress ?? "IP não informado"}).`,
    })
  } else if (ipCountryMatch) {
    score -= 10
    factors.push({
      label: "BIN e IP alinhados",
      impact: -10,
      reason: `BIN e IP apontam para ${binCountry}.`,
    })
  } else {
    factors.push({
      label: "Geolocalização IP parcial/ausente",
      impact: 0,
      reason: "Sem país do IP confirmado para comparar com o BIN.",
    })
  }

  return {
    ipCountry,
    binCountry,
    ipCountryMatch,
    countryRiskTier,
    score: clamp(score, 0, 100),
    factors,
  }
}
