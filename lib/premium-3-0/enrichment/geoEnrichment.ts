import { getEnv } from "@/lib/env"
import { fetchIpBlocklistDetailed, fetchIpInfoDetailed } from "@/lib/premium-3-0/neutrino"
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

export const COUNTRY_RISK_TIER = {
  TIER1_COUNTRIES,
  TIER2_COUNTRIES,
  CRITICAL_COUNTRIES,
}

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

type LegacyGeoInput = {
  ipCountry?: string | null
}

function resolveGeoInputs(requestIpOrLegacy: string | LegacyGeoInput | null | undefined, requestCountryHeader?: string | null) {
  if (requestIpOrLegacy && typeof requestIpOrLegacy === "object") {
    return {
      requestIp: null,
      requestCountry: requestIpOrLegacy.ipCountry ?? null,
    }
  }

  return {
    requestIp: requestIpOrLegacy ?? null,
    requestCountry: requestCountryHeader ?? null,
  }
}

export async function enrichGeo(
  binCountryCode: string,
  requestIpOrLegacy?: string | LegacyGeoInput | null,
  requestCountryHeader?: string | null,
) {
  const env = getEnv()
  const { requestIp, requestCountry } = resolveGeoInputs(requestIpOrLegacy, requestCountryHeader)

  const normalizedBinCountry = normalizeCountryCode(binCountryCode)
  const countryRiskTier = getCountryRiskTier(normalizedBinCountry)
  const factors: BinRiskFactor[] = []
  const sourcesUsed: string[] = []
  let ipCountryCode = normalizeCountryCode(requestCountry)
  let ipCity: string | null = null
  let ipRegion: string | null = null
  let ipIsHosting: boolean | null = null
  let ipIsVpn: boolean | null = null
  let ipIsProxy: boolean | null = null
  let ipIsTor: boolean | null = null
  let ipIsBogon: boolean | null = null
  let ipBlocklistHits: string[] = []
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

  const canUseIpInfo = Boolean(env.NEUTRINO_IP_INFO_ENABLED && requestIp)
  const canUseIpBlocklist = Boolean(env.NEUTRINO_IP_BLOCKLIST_ENABLED && requestIp)

  if (canUseIpInfo || canUseIpBlocklist) {
    try {
      const [ipInfoResult, ipBlocklistResult] = await Promise.all([
        canUseIpInfo ? fetchIpInfoDetailed({ ip: requestIp! }) : Promise.resolve(null),
        canUseIpBlocklist ? fetchIpBlocklistDetailed({ ip: requestIp! }) : Promise.resolve(null),
      ])

      if (ipInfoResult) {
        ipCountryCode = normalizeCountryCode(ipInfoResult.data.country_code ?? null) ?? ipCountryCode
        ipCity = ipInfoResult.data.city ?? null
        ipRegion = ipInfoResult.data.region ?? null
        ipIsHosting = ipInfoResult.data.is_hosting ?? null
        ipIsVpn = ipInfoResult.data.is_vpn ?? null
        ipIsProxy = ipInfoResult.data.is_proxy ?? null
        ipIsTor = ipInfoResult.data.is_tor ?? null
        ipIsBogon = ipInfoResult.data.is_bogon ?? null

        if (ipInfoResult.meta.networkSuccess) {
          sourcesUsed.push("neutrino-ip-info")
        }
      }

      if (ipBlocklistResult) {
        ipBlocklistHits = ipBlocklistResult.data.blocklists ?? []
        if (ipBlocklistResult.meta.networkSuccess) {
          sourcesUsed.push("neutrino-ip-blocklist")
        }
      }

      const neurinoRiskBoost = ipBlocklistHits.length > 0
        ? 30
        : ipIsProxy || ipIsVpn || ipIsTor
          ? 20
          : ipIsHosting
            ? 15
            : ipIsBogon
              ? 10
              : 0

      if (neurinoRiskBoost > 0) {
        score += neurinoRiskBoost
        factors.push({
          label: "Sinal de risco por inteligência real de IP",
          impact: neurinoRiskBoost,
          reason:
            ipBlocklistHits.length > 0
              ? `IP listado em blocklists: ${ipBlocklistHits.join(", ")}.`
              : ipIsProxy || ipIsVpn || ipIsTor
                ? "IP com sinal de proxy/VPN/Tor."
                : ipIsHosting
                  ? "IP de infraestrutura de hosting."
                  : "IP classificado como bogon.",
        })
      }
    } catch (error) {
      console.warn("[geo-enrichment] neutrino_ip_unavailable", {
        message: error instanceof Error ? error.message : String(error),
      })
      factors.push({
        label: "neutrino_ip_unavailable",
        impact: 0,
        reason: "IP enrichment indisponível, usando heurística local",
      })
    }
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
    ipCountry: ipCountryCode,
    ipCity,
    ipRegion,
    ipIsHosting,
    ipIsVpn,
    ipIsProxy,
    ipIsTor,
    ipIsBogon,
    ipBlocklistHits,
    ipCountryMatch: Boolean(normalizedBinCountry && ipCountryCode && normalizedBinCountry === ipCountryCode),
    ipCountryTier: countryRiskTier.toLowerCase(),
    distanceKm: null,
    countryRiskTier,
    score: clamp(score, 0, 100),
    factors,
    sourcesUsed,
  }
}
