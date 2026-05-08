import { getEnv } from "@/lib/env"
import { fetchUaLookupDetailed } from "@/lib/premium-3-0/neutrino"
import type { BinRiskFactor } from "../types"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function redactUserAgent(userAgent: string): string {
  return userAgent.slice(0, 30)
}

export type DeviceType = "mobile" | "desktop" | "tablet" | "bot" | "unknown"

export function parseDeviceType(userAgent?: string | null): DeviceType {
  const ua = (userAgent ?? "").toLowerCase()
  if (!ua) return "unknown"
  if (/(bot|headless|phantom|playwright|puppeteer|selenium|curl|python-requests|axios|scrapy)/i.test(ua)) return "bot"
  if (/(ipad|tablet|kindle|playbook)/i.test(ua)) return "tablet"
  if (/(iphone|android|mobile|ipod)/i.test(ua)) return "mobile"
  return "desktop"
}

function resolveBotImpact(botCategory: string | null | undefined) {
  const normalized = (botCategory ?? "").toLowerCase()
  if (normalized === "search-engine") return 0
  if (normalized === "library" || normalized === "scraper") return 25
  return 40
}

export async function enrichDevice(userAgent?: string | null) {
  const env = getEnv()
  const factors: BinRiskFactor[] = []
  let score = 15
  let deviceType = parseDeviceType(userAgent)
  let browserName: string | null = null
  let browserVersion: string | null = null
  let osName: string | null = null
  let osVersion: string | null = null
  let deviceModel: string | null = null
  let deviceManufacturer: string | null = null
  let isMobile: boolean | null = null
  let isBot: boolean | null = null
  let botCategory: string | null = null
  const sourcesUsed: string[] = []

  if (env.NEUTRINO_UA_LOOKUP_ENABLED && userAgent) {
    try {
      const uaLookup = await fetchUaLookupDetailed({ ua: userAgent })
      browserName = uaLookup.data.browser ?? null
      browserVersion = uaLookup.data.browser_version ?? null
      osName = uaLookup.data.os ?? null
      osVersion = uaLookup.data.os_version ?? null
      deviceModel = uaLookup.data.device_model ?? null
      deviceManufacturer = uaLookup.data.device_brand ?? null
      isMobile = uaLookup.data.is_mobile ?? null
      isBot = uaLookup.data.is_bot ?? null
      botCategory = uaLookup.data.bot_category ?? null

      if (uaLookup.meta.networkSuccess) {
        sourcesUsed.push("neutrino-ua-lookup")
      }

      if (isBot) {
        const impact = resolveBotImpact(botCategory)
        score += impact
        const redacted = redactUserAgent(userAgent)
        factors.push({
          label: "Bot detectado por UA Lookup",
          impact,
          reason: `Neutrino classificou o UA como bot (${botCategory ?? "unknown"}). UA: ${redacted}${userAgent.length > 30 ? "…" : ""}`,
        })
        deviceType = "bot"
      } else if (isMobile) {
        score += 5
        factors.push({
          label: "Dispositivo mobile identificado por UA Lookup",
          impact: 5,
          reason: "Dispositivo móvel detectado por parser autoritativo da Neutrino.",
        })
        deviceType = "mobile"
      } else {
        factors.push({
          label: "UA enriquecido com parser autoritativo",
          impact: 0,
          reason: "Navegador/sistema operacional identificados sem sinal de bot.",
        })
      }
    } catch (error) {
      console.warn("[device-enrichment] neutrino_ua_unavailable", {
        message: error instanceof Error ? error.message : String(error),
      })
      factors.push({
        label: "neutrino_ua_unavailable",
        impact: 0,
        reason: "UA enrichment indisponível, usando parser local",
      })
    }
  }

  if (!sourcesUsed.length) {
    if (deviceType === "unknown") {
      score += 20
      factors.push({
        label: "User-Agent ausente",
        impact: 20,
        reason: "Sem identificação de dispositivo, o motor assume maior incerteza operacional.",
      })
    } else if (deviceType === "bot") {
      score += 50
      const redacted = redactUserAgent(userAgent ?? "")
      factors.push({
        label: "Padrão de bot/headless detectado",
        impact: 50,
        reason: `O user-agent indica automação ou browser headless. UA: ${redacted}${(userAgent ?? "").length > 30 ? "…" : ""}`,
      })
    } else if (deviceType === "mobile") {
      score -= 5
      factors.push({
        label: "Dispositivo móvel comum",
        impact: -5,
        reason: "Fluxos mobile modernos tendem a ter telemetria e biometria mais consistentes.",
      })
    } else if (deviceType === "tablet") {
      factors.push({
        label: "Dispositivo tablet",
        impact: 0,
        reason: "Tablet identificado sem sinais de automação.",
      })
    } else {
      factors.push({
        label: "Desktop/browser tradicional",
        impact: 0,
        reason: "User-agent de desktop identificado sem sinais claros de automação.",
      })
    }
  }

  return {
    score: clamp(score, 0, 100),
    deviceType,
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceModel,
    deviceManufacturer,
    isMobile,
    isBot,
    botCategory,
    factors,
    sourcesUsed,
  }
}
