import type { BinRiskFactor } from "../types"

export type CountryRiskTier = "TIER1" | "TIER2" | "TIER3" | "CRITICAL"

const TIER1_COUNTRIES = new Set([
  "US",
  "GB",
  "CA",
  "AU",
  "DE",
  "FR",
  "JP",
  "NL",
  "SE",
  "NO",
  "FI",
  "DK",
  "CH",
  "SG",
  "BR",
  "MX",
  "ES",
  "IT",
])

const TIER2_COUNTRIES = new Set([
  "AT",
  "BE",
  "CL",
  "CO",
  "CR",
  "CZ",
  "EE",
  "GR",
  "HU",
  "IE",
  "IL",
  "IS",
  "KR",
  "LT",
  "LU",
  "NZ",
  "PL",
  "PT",
  "SI",
  "SK",
  "TR",
  "CN",
  "IN",
])

const CRITICAL_COUNTRIES = new Set(["NG", "VE", "PK", "BD", "KE", "GH", "CM", "RO", "UA", "BY", "RU", "IR", "KP"])

const BASE_SCORE_BY_TIER: Record<CountryRiskTier, number> = {
  TIER1: 15,
  TIER2: 35,
  TIER3: 55,
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

function isKnownMaskedIp(ip?: string | null) {
  if (!ip) return true

  return (
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("fd") ||
    ip.startsWith("fc")
  )
}

export function getCountryRiskTier(countryCode?: string | null): CountryRiskTier {
  const normalized = normalizeCountryCode(countryCode)

  if (!normalized) {
    return "TIER3"
  }

  if (CRITICAL_COUNTRIES.has(normalized)) {
    return "CRITICAL"
  }

  if (TIER1_COUNTRIES.has(normalized)) {
    return "TIER1"
  }

  if (TIER2_COUNTRIES.has(normalized)) {
    return "TIER2"
  }

  return "TIER3"
}

export function enrichGeo(binCountryCode: string, requestIp: string | null, requestCountryHeader: string | null) {
  const normalizedBinCountry = normalizeCountryCode(binCountryCode)
  const ipCountryCode = normalizeCountryCode(requestCountryHeader)
  const countryRiskTier = getCountryRiskTier(normalizedBinCountry)
  const factors: BinRiskFactor[] = []
  let score = normalizedBinCountry ? BASE_SCORE_BY_TIER[countryRiskTier] : 50

  if (normalizedBinCountry) {
    factors.push({
      label: `País emissor classificado como ${countryRiskTier}`,
      impact: BASE_SCORE_BY_TIER[countryRiskTier] - 20,
      reason: `O país ${normalizedBinCountry} foi classificado na faixa ${countryRiskTier} para risco geográfico.`,
    })
  } else {
    factors.push({
      label: "País emissor indisponível",
      impact: 20,
      reason: "Sem país de emissão, o risco geográfico fica em faixa conservadora por falta de contexto.",
    })
  }

  if (normalizedBinCountry && ipCountryCode && normalizedBinCountry === ipCountryCode) {
    score -= 10
    factors.push({
      label: "BIN e país do IP estão alinhados",
      impact: -10,
      reason: `O BIN aponta para ${normalizedBinCountry} e o cabeçalho do IP também indica ${ipCountryCode}.`,
    })
  } else if (normalizedBinCountry && ipCountryCode && normalizedBinCountry !== ipCountryCode) {
    if (!isKnownMaskedIp(requestIp)) {
      score += 25
      factors.push({
        label: "País do BIN difere do país do IP",
        impact: 25,
        reason: `O BIN está em ${normalizedBinCountry}, mas o IP aparenta estar em ${ipCountryCode} sem mascaramento conhecido.`,
      })
    } else {
      factors.push({
        label: "Diferença geográfica com IP mascarado ou privado",
        impact: 0,
        reason: `Há divergência entre BIN (${normalizedBinCountry}) e IP (${ipCountryCode}), mas o IP parece mascarado/privado.`,
      })
    }
  } else {
    factors.push({
      label: "Geolocalização do IP indisponível",
      impact: 0,
      reason: "Sem país do IP confirmado, a análise geográfica usa apenas o país emissor do BIN.",
    })
  }

  return {
    ipCountryCode,
    ipCountryMatch: Boolean(normalizedBinCountry && ipCountryCode && normalizedBinCountry === ipCountryCode),
    countryRiskTier,
    score: clamp(score, 0, 100),
    factors,
  }
}
