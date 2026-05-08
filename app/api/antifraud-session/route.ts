import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { analyzeSessionRisk } from "@/lib/premium-3-0/sessionRisk"

// ============================================================================
// Request validation
// ============================================================================

const antifraudSessionSchema = z.object({
  fingerprint: z.string().max(512).nullable().optional(),
  screen: z
    .object({
      w: z.number().int().min(1).max(32767),
      h: z.number().int().min(1).max(32767),
      colorDepth: z.number().int().min(1).max(64),
    })
    .nullable()
    .optional(),
  languages: z.array(z.string().max(32)).max(20).optional(),
  timezone: z.string().max(128).nullable().optional(),
})

type AntifraudSessionBody = z.infer<typeof antifraudSessionSchema>

function buildErrorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status })
}

/**
 * Extrai o IP real do request a partir dos headers Vercel/Cloudflare.
 * Nunca retorna IPs privados/loopback — nesses casos retorna null.
 */
function extractRealIp(request: NextRequest): string | null {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim(),
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    request.headers.get("x-real-ip"),
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    if (
      candidate === "::1" ||
      candidate.startsWith("127.") ||
      candidate.startsWith("10.") ||
      candidate.startsWith("192.168.") ||
      candidate.startsWith("172.16.") ||
      candidate.startsWith("172.17.") ||
      candidate.startsWith("172.18.") ||
      candidate.startsWith("172.19.") ||
      candidate.startsWith("172.2") ||
      candidate.startsWith("fc") ||
      candidate.startsWith("fd")
    ) {
      continue
    }
    return candidate
  }

  return null
}

// ============================================================================
// POST /api/antifraud-session
// ============================================================================

/**
 * Analyzes the current visitor's session for fraud risk.
 *
 * Accepts optional browser signals from the client:
 * - fingerprint: lightweight hash from crypto.subtle (no external libs)
 * - screen: { w, h, colorDepth }
 * - languages: navigator.languages
 * - timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
 *
 * Server-side enrichments: Neutrino IP Info, IP Blocklist, UA Lookup, Host Reputation.
 * Returns a SessionRiskResponse with riskScore, riskLevel, recommendation, and factors.
 *
 * TODO (Fase 6): Add rate limiting per IP.
 *
 * Neutrino quota per request (when all flags enabled):
 *   IP Info: 1 credit · IP Blocklist: 1 credit · UA Lookup: 1 credit · Host Reputation: 1 credit
 *   Total: up to 4 credits/request (cached results: 0 credits)
 */
export async function POST(request: NextRequest) {
  let body: AntifraudSessionBody = {}

  // Parse body — empty body is valid (all fields are optional)
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return buildErrorResponse(400, "INVALID_REQUEST", "Corpo da requisição JSON inválido.")
    }

    const validation = antifraudSessionSchema.safeParse(rawBody)
    if (!validation.success) {
      const firstIssue = validation.error.issues[0]
      return buildErrorResponse(400, "INVALID_REQUEST", firstIssue?.message ?? "Requisição inválida")
    }

    body = validation.data
  }

  const ip = extractRealIp(request)
  const userAgent = request.headers.get("user-agent") ?? null

  try {
    const result = await analyzeSessionRisk({
      ip,
      userAgent,
      client: {
        fingerprint: body.fingerprint ?? null,
        timezone: body.timezone ?? null,
        languages: body.languages ?? [],
        screen: body.screen ?? null,
      },
    })

    // Never return the raw IP to the client — only ipMasked
    const { ip: _rawIp, ...safeResult } = result

    return NextResponse.json({ ok: true, data: safeResult })
  } catch (error) {
    console.error("[antifraud-session] Unexpected error", {
      error: error instanceof Error ? error.message : error,
    })
    return buildErrorResponse(500, "INTERNAL_SERVER_ERROR", "Falha inesperada ao processar a análise.")
  }
}
