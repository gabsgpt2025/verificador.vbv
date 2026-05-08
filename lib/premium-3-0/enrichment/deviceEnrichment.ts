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

export function enrichDevice(userAgent?: string | null) {
  const factors: BinRiskFactor[] = []
  let score = 15
  const deviceType = parseDeviceType(userAgent)

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

  return { score: clamp(score, 0, 100), deviceType, factors }
}
