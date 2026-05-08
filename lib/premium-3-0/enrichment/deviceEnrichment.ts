import type { BinRiskFactor } from "../types"

type DeviceType = "mobile" | "desktop" | "tablet" | "unknown"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function sanitize(value: string) {
  return value.replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim()
}

export function redactUserAgent(userAgent?: string | null) {
  if (!userAgent) return "n/a"
  return sanitize(userAgent)
    .replace(/\d/g, "x")
    .slice(0, 30)
}

function detectDeviceType(userAgent: string): DeviceType {
  if (/ipad|tablet|kindle/i.test(userAgent)) return "tablet"
  if (/android|iphone|mobile/i.test(userAgent)) return "mobile"
  if (!userAgent) return "unknown"
  return "desktop"
}

function detectBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) return "Edge"
  if (/chrome\//i.test(userAgent)) return "Chrome"
  if (/firefox\//i.test(userAgent)) return "Firefox"
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return "Safari"
  return "Unknown"
}

export function enrichDevice(userAgent?: string | null) {
  const ua = userAgent ?? ""
  const deviceType = detectDeviceType(ua)
  const browser = detectBrowser(ua)
  const isBot = /(bot|crawler|spider|headless|playwright|puppeteer|selenium|curl|wget|python-requests)/i.test(ua)
  const factors: BinRiskFactor[] = []
  let score = 10

  if (isBot) {
    score += 40
    factors.push({
      label: "Padrão bot/headless",
      impact: 40,
      reason: `User-Agent suspeito (redacted: ${redactUserAgent(ua)}).`,
    })
  } else if (deviceType === "mobile") {
    score += 5
    factors.push({
      label: "Dispositivo mobile",
      impact: 5,
      reason: `Sessão mobile detectada (redacted: ${redactUserAgent(ua)}).`,
    })
  } else {
    factors.push({
      label: "Dispositivo desktop/baseline",
      impact: 0,
      reason: `User-Agent regular (redacted: ${redactUserAgent(ua)}).`,
    })
  }

  return {
    deviceType,
    browser,
    isBot,
    score: clamp(score, 0, 100),
    factors,
  }
}
