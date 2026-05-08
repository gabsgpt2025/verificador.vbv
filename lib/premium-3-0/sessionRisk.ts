/**
 * VeriFiBIN 3.0 — Session Risk Engine (Fase 5)
 *
 * Orquestrador de análise antifraude do visitante (sessão/dispositivo/rede).
 * Reutiliza os clientes Neutrino Tier 1 já existentes (IP Info, IP Blocklist,
 * UA Lookup, Host Reputation) sem duplicar lógica.
 *
 * Não envolve BIN de cartão — analisa o *próprio visitante*.
 */

import { getEnv } from "@/lib/env"
import type { DeviceInfo, NetworkFlags, RiskLevel, SessionRiskRecommendation, SessionRiskResponse } from "./holisticTypes"
import { fetchIpBlocklistDetailed } from "./neutrino/ipBlocklist"
import { fetchHostReputationDetailed } from "./neutrino/hostReputation"
import { fetchIpInfoDetailed } from "./neutrino/ipInfo"
import { fetchUaLookupDetailed } from "./neutrino/uaLookup"
import { parseDeviceType } from "./enrichment/deviceEnrichment"

// ============================================================================
// IP Masking
// ============================================================================

/**
 * Mascara parcialmente um endereço IP para exibição segura ao cliente.
 * IPv4: mostra 1º e último octeto, mascara os dois do meio (ex: "201.x.x.42").
 * IPv6: mostra 1º e último grupo, mascara o resto (ex: "2001:x:x:x:x:x:x:db8").
 */
export function maskIp(ip: string): string {
  const v4Match = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4Match) {
    return `${v4Match[1]}.x.x.${v4Match[4]}`
  }

  const v6Parts = ip.split(":")
  if (v6Parts.length >= 2) {
    const first = v6Parts[0]
    const last = v6Parts[v6Parts.length - 1]
    return `${first}:x:x:x:x:x:x:${last}`
  }

  return ip.slice(0, Math.min(4, ip.length)) + "x.x.x"
}

// ============================================================================
// Score Calculation
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max)
}

function scoreToLevel(score: number): RiskLevel {
  if (score <= 25) return "LOW"
  if (score <= 50) return "MEDIUM"
  if (score <= 75) return "HIGH"
  return "CRITICAL"
}

function levelToRecommendation(level: RiskLevel): SessionRiskRecommendation {
  switch (level) {
    case "LOW":
      return "ALLOW"
    case "MEDIUM":
      return "REVIEW"
    case "HIGH":
      return "CHALLENGE"
    case "CRITICAL":
      return "BLOCK"
  }
}

interface ScoreInput {
  network: NetworkFlags
  device: DeviceInfo
  hostListed: boolean
}

interface ScoreResult {
  score: number
  factors: Array<{ label: string; impact: number; reason: string }>
}

function calculateSessionScore(input: ScoreInput): ScoreResult {
  const factors: Array<{ label: string; impact: number; reason: string }> = []
  let score = 20 // base score

  // ── Network flags ──────────────────────────────────────────────────────────
  if (input.network.isTor) {
    score += 30
    factors.push({ label: "Rede TOR detectada", impact: 30, reason: "O IP de origem é um nó da rede TOR, frequentemente associado a ocultação de identidade." })
  }
  if (input.network.isVpn) {
    score += 20
    factors.push({ label: "VPN detectada", impact: 20, reason: "O IP aparenta ser de um provedor VPN, indicando possível ocultação de localização." })
  }
  if (input.network.isProxy) {
    score += 15
    factors.push({ label: "Proxy público detectado", impact: 15, reason: "O IP está associado a um proxy público que pode mascarar a identidade real do usuário." })
  }
  if (input.network.isHijacked) {
    score += 25
    factors.push({ label: "IP em faixa sequestrada", impact: 25, reason: "O bloco de IP foi marcado como potencialmente sequestrado (BGP hijack ou uso indevido)." })
  }
  if (input.network.isMalware) {
    score += 25
    factors.push({ label: "IP associado a malware/phishing", impact: 25, reason: "Este IP consta em listas de distribuição de malware ou phishing." })
  }
  if (input.network.isBot) {
    score += 20
    factors.push({ label: "IP classificado como bot (rede)", impact: 20, reason: "A reputação de rede deste IP indica atividade automatizada ou de bot." })
  }
  if (input.network.isSpider) {
    score += 10
    factors.push({ label: "Spider/crawler detectado", impact: 10, reason: "O IP está associado a crawlers ou spiders que podem indicar scraping automatizado." })
  }
  if (input.network.isListed) {
    score += 5
    factors.push({ label: "IP listado em blocklist", impact: 5, reason: "O IP consta em pelo menos uma blocklist de reputação." })
  }
  if (input.network.blocklistCount > 0) {
    const blocklistImpact = clamp(input.network.blocklistCount * 3, 0, 15)
    score += blocklistImpact
    factors.push({
      label: "Múltiplas entradas em blocklist",
      impact: blocklistImpact,
      reason: `O IP aparece em ${input.network.blocklistCount} blocklist(s), indicando histórico negativo de reputação.`,
    })
  }

  // ── Device signals ─────────────────────────────────────────────────────────
  if (input.device.isBot) {
    score += 25
    factors.push({ label: "User-Agent classificado como bot", impact: 25, reason: "O user-agent indica automação, browser headless ou ferramenta de scraping." })
  } else if (input.device.deviceType === "UNKNOWN") {
    score += 10
    factors.push({ label: "Tipo de dispositivo desconhecido", impact: 10, reason: "Sem identificação clara do dispositivo pelo user-agent." })
  } else if (input.device.isMobile) {
    score -= 5
    factors.push({ label: "Dispositivo móvel residencial", impact: -5, reason: "Dispositivos móveis comuns tendem a ter telemetria mais consistente, reduzindo o risco base." })
  }

  // ── Host reputation ────────────────────────────────────────────────────────
  if (input.hostListed) {
    score += 10
    factors.push({ label: "Hostname com reputação negativa", impact: 10, reason: "O hostname do IP aparece em listas de reputação negativa ou categorias suspeitas." })
  }

  return { score: clamp(score, 0, 100), factors }
}

// ============================================================================
// Neutrino helpers (with feature-flag guards)
// ============================================================================

/** Safely call a Neutrino function, returning null on any error. */
async function safeCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}

// ============================================================================
// Public API
// ============================================================================

export interface SessionRiskInput {
  ip: string | null
  userAgent: string | null
  client?: {
    fingerprint?: string | null
    timezone?: string | null
    languages?: string[]
    screen?: { w: number; h: number; colorDepth: number } | null
  }
}

/**
 * Analisa o risco da sessão atual (visitante), retornando um `SessionRiskResponse`.
 *
 * Calls Neutrino Tier 1 enrichments respeitando as feature flags:
 *   - NEUTRINO_IP_INFO_ENABLED → IP Info
 *   - NEUTRINO_IP_BLOCKLIST_ENABLED → IP Blocklist
 *   - NEUTRINO_UA_LOOKUP_ENABLED → UA Lookup
 *   - NEUTRINO_HOST_REPUTATION_ENABLED → Host Reputation
 *
 * TODO (Fase 6): rate limiting por IP no endpoint chamador.
 */
export async function analyzeSessionRisk(input: SessionRiskInput): Promise<SessionRiskResponse> {
  const env = getEnv()
  const { ip, userAgent, client } = input

  const sourcesUsed: string[] = []

  // ── IP Info ───────────────────────────────────────────────────────────────
  let ipInfoData: Record<string, unknown> | null = null
  if (ip && env.NEUTRINO_IP_INFO_ENABLED) {
    const result = await safeCall(() => fetchIpInfoDetailed({ ip }))
    if (result) {
      ipInfoData = result.data as Record<string, unknown>
      sourcesUsed.push("neutrino:ip-info")
    }
  }

  // ── IP Blocklist ─────────────────────────────────────────────────────────
  let ipBlocklistData: Record<string, unknown> | null = null
  if (ip && env.NEUTRINO_IP_BLOCKLIST_ENABLED) {
    const result = await safeCall(() => fetchIpBlocklistDetailed({ ip }))
    if (result) {
      ipBlocklistData = result.data as Record<string, unknown>
      sourcesUsed.push("neutrino:ip-blocklist")
    }
  }

  // ── UA Lookup ─────────────────────────────────────────────────────────────
  let uaData: Record<string, unknown> | null = null
  if (userAgent && env.NEUTRINO_UA_LOOKUP_ENABLED) {
    const result = await safeCall(() => fetchUaLookupDetailed({ ua: userAgent }))
    if (result) {
      uaData = result.data as Record<string, unknown>
      sourcesUsed.push("neutrino:ua-lookup")
    }
  }

  // ── Geo data ──────────────────────────────────────────────────────────────
  const geoHostname = String(ipInfoData?.hostname ?? ipInfoData?.reverse_dns ?? "")
  const geo = {
    country: String(ipInfoData?.country ?? ipInfoData?.country_code ?? "") || null,
    city: String(ipInfoData?.city ?? "") || null,
    isp: String(ipInfoData?.provider ?? ipInfoData?.isp ?? "") || null,
    asn: String(ipInfoData?.asn ?? "") || null,
    hostname: geoHostname || null,
  }

  // ── Host Reputation ────────────────────────────────────────────────────────
  let hostReputationResult: SessionRiskResponse["hostReputation"] = null
  if (geoHostname && env.NEUTRINO_HOST_REPUTATION_ENABLED) {
    const result = await safeCall(() => fetchHostReputationDetailed({ host: geoHostname }))
    if (result) {
      const hrData = result.data
      hostReputationResult = {
        score: hrData.reputation_score ?? null,
        listed: hrData.is_listed ?? false,
        categories: (hrData.lists as string[]) ?? [],
      }
      sourcesUsed.push("neutrino:host-reputation")
    }
  }

  // ── Network Flags ─────────────────────────────────────────────────────────
  // Merge flags from IP Info (vpn/proxy/tor quick flags) and IP Blocklist (extended)
  const ipInfoRaw = ipInfoData ?? {}
  const ipBlocklistRaw = ipBlocklistData ?? {}

  const network: NetworkFlags = {
    isTor: Boolean((ipInfoRaw.is_tor ?? ipBlocklistRaw.is_tor) || false),
    isProxy: Boolean((ipInfoRaw.is_proxy ?? ipBlocklistRaw.is_proxy) || false),
    isVpn: Boolean((ipInfoRaw.is_vpn ?? ipBlocklistRaw.is_vpn) || false),
    isHijacked: Boolean((ipBlocklistRaw.is_hijacked) || false),
    isSpider: Boolean((ipBlocklistRaw.is_spider) || false),
    isMalware: Boolean((ipBlocklistRaw.is_malware) || false),
    isBot: Boolean((ipBlocklistRaw.is_bot) || false),
    isListed: Boolean((ipBlocklistRaw.is_listed) || false),
    blocklistCount: Number(ipBlocklistRaw.list_count ?? (ipBlocklistRaw as { blocklist_count?: number }).blocklist_count ?? 0),
  }

  // ── Device Info ────────────────────────────────────────────────────────────
  let device: DeviceInfo

  if (uaData) {
    // Map Neutrino UA Lookup response
    const uaType = String(uaData.type ?? "").toUpperCase()
    let deviceType: DeviceInfo["deviceType"] = "UNKNOWN"
    if (uaData.is_bot) {
      deviceType = "BOT"
    } else if (uaType === "MOBILE-BROWSER" || uaType === "MOBILE") {
      deviceType = "MOBILE"
    } else if (uaType === "TABLET") {
      deviceType = "TABLET"
    } else if (uaType === "DESKTOP-BROWSER" || uaType === "DESKTOP") {
      deviceType = "DESKTOP"
    } else if (uaType) {
      deviceType = "DESKTOP" // default to desktop for known UA types
    }

    device = {
      browser: String(uaData.browser ?? "") || null,
      browserVersion: String(uaData.browser_version ?? "") || null,
      os: String(uaData.os ?? "") || null,
      osVersion: String(uaData.os_version ?? "") || null,
      deviceType,
      isMobile: Boolean(uaData.is_mobile) || deviceType === "MOBILE",
      isBot: Boolean(uaData.is_bot),
    }
  } else {
    // Fallback: use local UA parser
    const parsedType = parseDeviceType(userAgent)
    const deviceTypeMap: Record<string, DeviceInfo["deviceType"]> = {
      mobile: "MOBILE",
      desktop: "DESKTOP",
      tablet: "TABLET",
      bot: "BOT",
      unknown: "UNKNOWN",
    }
    device = {
      browser: null,
      browserVersion: null,
      os: null,
      osVersion: null,
      deviceType: deviceTypeMap[parsedType] ?? "UNKNOWN",
      isMobile: parsedType === "mobile",
      isBot: parsedType === "bot",
    }
    if (userAgent) {
      sourcesUsed.push("local:ua-parser")
    }
  }

  // ── Score + Risk Level ─────────────────────────────────────────────────────
  const { score, factors } = calculateSessionScore({
    network,
    device,
    hostListed: hostReputationResult?.listed ?? false,
  })

  const riskLevel = scoreToLevel(score)
  const recommendation = levelToRecommendation(riskLevel)

  return {
    ip,
    ipMasked: ip ? maskIp(ip) : "x.x.x.x",
    geo,
    network,
    device,
    hostReputation: hostReputationResult,
    client: {
      fingerprint: client?.fingerprint ?? null,
      timezone: client?.timezone ?? null,
      languages: client?.languages ?? [],
      screen: client?.screen ?? null,
    },
    riskScore: score,
    riskLevel,
    recommendation,
    factors,
    sourcesUsed,
    generatedAt: new Date().toISOString(),
  }
}
