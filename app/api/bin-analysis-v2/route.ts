import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { subtractCredits } from "@/lib/credits/operations"
import { normalizeNeutrinoBinResponse } from "@/lib/premium-3-0/normalizeBinApiResponse"
import { applyBinOverrides } from "@/lib/premium-3-0/applyBinOverrides"
import { runFullBinAnalysis, runHolisticAnalysis } from "@/lib/premium-3-0"
import { saveBinAnalysisLog } from "@/lib/premium-3-0/saveBinAnalysisLog"
import { callNeutrinoApi } from "@/lib/premium-3-0/neutrino-api"
import type { BinApiData, FullBinAnalysis } from "@/lib/premium-3-0/types"
import type { AnalysisRequest, ValidationResult } from "@/lib/premium-3-0/holisticTypes"
import type { TransactionContext } from "@/lib/premium-3-0/holisticEngine"
import { OPEN_ACCESS_MODE } from "@/lib/open-access-mode"

// ============================================================================
// Validação de request (AnalysisRequest)
// ============================================================================

const analysisRequestSchema = z.object({
  bin: z
    .string()
    .regex(/^\d{6,8}$/, "bin deve conter entre 6 e 8 dígitos numéricos"),
  context: z
    .object({
      amount: z.number().min(0).optional(),
      currency: z.string().optional(),
      merchantCountry: z.string().optional(),
      merchantCategoryCode: z.string().optional(),
      timestamp: z.number().optional(),
      userAgent: z.string().nullable().optional(),
      ipAddress: z.string().nullable().optional(),
      ipCountryCode: z.string().nullable().optional(),
      isFirstTransaction: z.boolean().optional(),
    })
    .optional(),
  transactionAmount: z
    .number()
    .min(0, "transactionAmount deve ser ≥ 0")
    .optional(),
  transactionCurrency: z.string().optional(),
  merchantCountry: z.string().optional(),
  isFirstTransaction: z.boolean().optional(),
})

/**
 * Valida e converte o body recebido pelo endpoint para AnalysisRequest.
 * Retorna o objeto tipado em caso de sucesso, ou um objeto de erro estruturado.
 */
function validateAnalysisRequest(body: unknown): ValidationResult<AnalysisRequest> {
  const result = analysisRequestSchema.safeParse(body)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return { ok: false, error: firstIssue?.message ?? "Requisição inválida" }
  }
  return { ok: true, data: result.data as AnalysisRequest }
}

// Open-access mode: when NEXT_PUBLIC_REQUIRE_AUTH !== "true", allow unauthenticated BIN analysis
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 30
const requestCounters = new Map<string, { count: number; windowStart: number }>()
const BIN_ANALYSIS_CREDIT_COST = 3

function getRequestId(request: NextRequest): string {
  return request.headers.get("x-request-id") || crypto.randomUUID()
}

function buildErrorResponse(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        requestId,
      },
    },
    { status },
  )
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const errorMessageLowerCase = error.message.toLowerCase()
  return error.name === "TimeoutError" || error.name === "AbortError" || errorMessageLowerCase.includes("timeout")
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const current = requestCounters.get(key)

  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestCounters.set(key, { count: 1, windowStart: now })
    return false
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  current.count += 1
  requestCounters.set(key, current)
  return false
}

function resolveTransactionContext(request: NextRequest, payload: AnalysisRequest): TransactionContext {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
  const headerCountry = request.headers.get("x-vercel-ip-country") ?? null
  const userAgent = request.headers.get("user-agent") ?? null
  const context = payload.context ?? {}

  return {
    amount: context.amount ?? payload.transactionAmount,
    currency: context.currency ?? payload.transactionCurrency ?? "BRL",
    merchantCountry: context.merchantCountry ?? payload.merchantCountry,
    merchantCategoryCode: context.merchantCategoryCode,
    timestamp: context.timestamp ?? Date.now(),
    userAgent: context.userAgent ?? userAgent,
    ipAddress: context.ipAddress ?? forwardedFor,
    ipCountryCode: context.ipCountryCode ?? headerCountry,
    isFirstTransaction: context.isFirstTransaction ?? payload.isFirstTransaction,
  }
}

function buildSafeContextEcho(context: TransactionContext) {
  return {
    amount: context.amount,
    currency: context.currency,
    merchantCountry: context.merchantCountry,
    merchantCategoryCode: context.merchantCategoryCode,
    timestamp: context.timestamp,
    ipCountryCode: context.ipCountryCode ?? null,
    isFirstTransaction: context.isFirstTransaction ?? null,
    userAgentPresent: Boolean(context.userAgent),
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)

  try {
    const requesterId =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous"

    if (isRateLimited(requesterId)) {
      return buildErrorResponse(429, "RATE_LIMITED", "Muitas requisições. Tente novamente em instantes.", requestId)
    }

    const rawBody: unknown = await request.json()
    const validation = validateAnalysisRequest(rawBody)
    if (!validation.ok) {
      return buildErrorResponse(400, "INVALID_REQUEST", validation.error, requestId)
    }
    const { bin } = validation.data
    const resolvedContext = resolveTransactionContext(request, validation.data)

    const cleanBin = bin.substring(0, 8)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // In open-access mode, allow unauthenticated requests (skip auth & credit checks)
    if (!user && !OPEN_ACCESS_MODE) {
      return buildErrorResponse(401, "UNAUTHORIZED", "Não autorizado", requestId)
    }

    // Chama API real da Neutrino para análise de BIN
    let binData: BinApiData
    try {
      const neutrinoResponse = await callNeutrinoApi(cleanBin)
      binData = normalizeNeutrinoBinResponse(neutrinoResponse, cleanBin)
    } catch (error) {
      const status = isTimeoutError(error) ? 504 : 502
      console.error("[bin-analysis-v2] Neutrino upstream failure", {
        requestId,
        bin: cleanBin,
        status,
        error: error instanceof Error ? error.message : error,
      })

      return buildErrorResponse(
        status,
        "UPSTREAM_NEUTRINO_FAILURE",
        "Falha temporária na consulta do BIN. Tente novamente.",
        requestId,
      )
    }

    // Aplica overrides internos antes da análise (requer supabase — skip for guest)
    const binDataWithOverrides = user
      ? (await applyBinOverrides(supabase, binData)).data
      : binData

    // Executa análise completa
    const analysis: FullBinAnalysis = runFullBinAnalysis(binDataWithOverrides, resolvedContext)
    const holistic = runHolisticAnalysis(binDataWithOverrides, resolvedContext)

    // Salva log interno (somente para usuários autenticados)
    if (user) {
      try {
        await saveBinAnalysisLog(supabase, user.id, analysis)
      } catch (logError) {
        console.error("[bin-analysis-v2] Failed to save analysis log", {
          requestId,
          bin: cleanBin,
          error: logError instanceof Error ? logError.message : logError,
        })
        return buildErrorResponse(
          500,
          "BIN_ANALYSIS_LOG_INSERT_FAILED",
          "Falha ao registrar o histórico da análise.",
          requestId,
        )
      }
    }

    // Deduz créditos somente quando há um usuário autenticado e após sucesso completo da análise
    if (user) {
      const creditResult = await subtractCredits(user.id, BIN_ANALYSIS_CREDIT_COST, `VeriFiBIN 2.0 — BIN: ${cleanBin}`)
      if (!creditResult.success) {
        return buildErrorResponse(400, "INSUFFICIENT_CREDITS", creditResult.message, requestId)
      }
    }

    return NextResponse.json({
      ...analysis,
      holistic,
      context: buildSafeContextEcho(resolvedContext),
    })
  } catch (error) {
    console.error("[bin-analysis-v2] Unexpected error", {
      requestId,
      error: error instanceof Error ? error.message : error,
    })
    return buildErrorResponse(500, "INTERNAL_SERVER_ERROR", "Falha inesperada ao processar a análise.", requestId)
  }
}
