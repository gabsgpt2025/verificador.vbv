/**
 * Enriched Analysis Service — FASE 2
 *
 * Orquestra TODAS as APIs externas para enriquecer a análise BIN:
 * - Neutrino: ip-info, ip-blocklist, ip-probe, ua-lookup, host-reputation
 * - FraudLabs Pro: fraud screening
 * - Mastercard: Identity Insights, Fraud Scoring
 *
 * Este serviço é chamado pelo route handler /api/bin-analysis-v2 para
 * executar todas as chamadas em paralelo e retornar um resultado consolidado.
 *
 * Princípios:
 * - Todas as chamadas são opcionais (fail-safe)
 * - Feature flags respeitados para Neutrino
 * - Cache utilizado em cada API individualmente
 * - Resultado inclui proveniência de cada dado
 */

import { getEnv } from "@/lib/env"
import { analyzeSessionRisk, type SessionRiskInput } from "../sessionRisk"
import { fetchIpProbeDetailed } from "../neutrino/ipProbe"
import { screenOrderFraudLabs, isFraudLabsEnabled } from "@/lib/integrations/fraudlabs"
import {
  fetchMastercardIdentityInsights,
  fetchMastercardFraudScore,
  isMastercardEnhancedEnabled,
} from "@/lib/integrations/mastercard"
import type { SessionRiskResponse } from "../holisticTypes"
import type { FraudLabsResult } from "@/lib/integrations/fraudlabs"
import type { MastercardIdentityResult, MastercardFraudScoreResult } from "@/lib/integrations/mastercard"
import type { IpProbeResponse } from "../neutrino/ipProbe"

// ============================================================================
// Types
// ============================================================================

export interface EnrichedAnalysisInput {
  bin: string
  ip?: string | null
  userAgent?: string | null
  amount?: number
  currency?: string
  merchantCountry?: string
  countryCode?: string
}

export interface EnrichedAnalysisResult {
  /** Análise de risco da sessão (Neutrino: ip-info, ip-blocklist, ua-lookup, host-reputation) */
  sessionRisk: SessionRiskResponse | null
  /** Resultado do IP Probe avançado (Neutrino: ip-probe) */
  ipProbe: IpProbeResponse | null
  /** Resultado do FraudLabs Pro */
  fraudLabs: FraudLabsResult | null
  /** Resultado do Mastercard Identity Insights */
  mastercardIdentity: MastercardIdentityResult | null
  /** Resultado do Mastercard Fraud Scoring */
  mastercardFraud: MastercardFraudScoreResult | null
  /** Proveniência de cada dado */
  dataProvenance: DataProvenance
  /** APIs chamadas e seus status */
  apiDiagnostics: ApiDiagnostic[]
}

export interface DataProvenance {
  /** Fonte dos dados do BIN (mantida pelo route) */
  binData: string
  /** Fonte dos dados de risco de sessão */
  sessionRisk: string
  /** Fonte dos dados de fraude */
  fraudScoring: string
  /** Fonte dos dados de identidade */
  identityCheck: string
  /** Fonte dos dados de IP avançado */
  ipProbe: string
  /** Confiança geral nos dados */
  overallConfidence: "HIGH" | "MEDIUM" | "LOW"
}

export interface ApiDiagnostic {
  api: string
  status: "success" | "error" | "disabled" | "skipped"
  latencyMs: number
  message: string
}

// ============================================================================
// Safe wrappers
// ============================================================================

async function safeCall<T>(
  name: string,
  fn: () => Promise<T | null>,
  diagnostics: ApiDiagnostic[],
): Promise<T | null> {
  const start = Date.now()
  try {
    const result = await fn()
    diagnostics.push({
      api: name,
      status: result ? "success" : "skipped",
      latencyMs: Date.now() - start,
      message: result ? "OK" : "No data returned",
    })
    return result
  } catch (error) {
    diagnostics.push({
      api: name,
      status: "error",
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

// ============================================================================
// Main orchestrator
// ============================================================================

/**
 * Executa TODAS as APIs de enriquecimento em paralelo.
 * Cada API é independente — falha em uma não afeta as demais.
 */
export async function runEnrichedAnalysis(
  input: EnrichedAnalysisInput,
): Promise<EnrichedAnalysisResult> {
  const env = getEnv()
  const diagnostics: ApiDiagnostic[] = []

  // Prepara todas as chamadas em paralelo
  const promises: {
    sessionRisk: Promise<SessionRiskResponse | null>
    ipProbe: Promise<IpProbeResponse | null>
    fraudLabs: Promise<FraudLabsResult | null>
    mastercardIdentity: Promise<MastercardIdentityResult | null>
    mastercardFraud: Promise<MastercardFraudScoreResult | null>
  } = {
    // ── Neutrino Session Risk (ip-info + ip-blocklist + ua-lookup + host-reputation) ──
    sessionRisk: input.ip
      ? safeCall("neutrino:session-risk", async () => {
          const sessionInput: SessionRiskInput = {
            ip: input.ip!,
            userAgent: input.userAgent ?? null,
          }
          return analyzeSessionRisk(sessionInput)
        }, diagnostics)
      : (() => {
          diagnostics.push({
            api: "neutrino:session-risk",
            status: "skipped",
            latencyMs: 0,
            message: "No IP address provided",
          })
          return Promise.resolve(null)
        })(),

    // ── Neutrino IP Probe (detecção avançada de VPN/proxy) ──
    ipProbe: input.ip && env.NEUTRINO_IP_PROBE_ENABLED
      ? safeCall("neutrino:ip-probe", async () => {
          const result = await fetchIpProbeDetailed({ ip: input.ip! })
          return result.data
        }, diagnostics)
      : (() => {
          diagnostics.push({
            api: "neutrino:ip-probe",
            status: input.ip ? "disabled" : "skipped",
            latencyMs: 0,
            message: input.ip
              ? "NEUTRINO_IP_PROBE_ENABLED=false"
              : "No IP address provided",
          })
          return Promise.resolve(null)
        })(),

    // ── FraudLabs Pro ──
    fraudLabs: isFraudLabsEnabled()
      ? safeCall("fraudlabs-pro", async () => {
          return screenOrderFraudLabs({
            ip: input.ip ?? undefined,
            bin: input.bin,
            amount: input.amount,
            currency: input.currency,
          })
        }, diagnostics)
      : (() => {
          diagnostics.push({
            api: "fraudlabs-pro",
            status: "disabled",
            latencyMs: 0,
            message: "FRAUDLABS_PRO_API_KEY not configured",
          })
          return Promise.resolve(null)
        })(),

    // ── Mastercard Identity Insights ──
    mastercardIdentity: isMastercardEnhancedEnabled()
      ? safeCall("mastercard:identity", async () => {
          return fetchMastercardIdentityInsights({
            bin: input.bin,
            ipAddress: input.ip ?? undefined,
            countryCode: input.countryCode,
          })
        }, diagnostics)
      : (() => {
          diagnostics.push({
            api: "mastercard:identity",
            status: "disabled",
            latencyMs: 0,
            message: "Mastercard credentials not configured",
          })
          return Promise.resolve(null)
        })(),

    // ── Mastercard Fraud Scoring ──
    mastercardFraud: isMastercardEnhancedEnabled()
      ? safeCall("mastercard:fraud-score", async () => {
          return fetchMastercardFraudScore({
            bin: input.bin,
            amount: input.amount,
            currency: input.currency,
            merchantCountry: input.merchantCountry,
          })
        }, diagnostics)
      : (() => {
          diagnostics.push({
            api: "mastercard:fraud-score",
            status: "disabled",
            latencyMs: 0,
            message: "Mastercard credentials not configured",
          })
          return Promise.resolve(null)
        })(),
  }

  // Executa todas em paralelo
  const [sessionRisk, ipProbe, fraudLabs, mastercardIdentity, mastercardFraud] = await Promise.all([
    promises.sessionRisk,
    promises.ipProbe,
    promises.fraudLabs,
    promises.mastercardIdentity,
    promises.mastercardFraud,
  ])

  // Calcula proveniência e confiança
  const successCount = diagnostics.filter((d) => d.status === "success").length
  const totalApis = diagnostics.length
  const overallConfidence: DataProvenance["overallConfidence"] =
    successCount >= 3 ? "HIGH" : successCount >= 1 ? "MEDIUM" : "LOW"

  const dataProvenance: DataProvenance = {
    binData: "MULTI_SOURCE_LOOKUP", // Set by route
    sessionRisk: sessionRisk ? "NEUTRINO_SESSION_RISK" : "NOT_AVAILABLE",
    fraudScoring: fraudLabs
      ? "FRAUDLABS_PRO"
      : mastercardFraud
        ? "MASTERCARD_FRAUD"
        : "NOT_AVAILABLE",
    identityCheck: mastercardIdentity ? "MASTERCARD_IDENTITY" : "NOT_AVAILABLE",
    ipProbe: ipProbe ? "NEUTRINO_IP_PROBE" : "NOT_AVAILABLE",
    overallConfidence,
  }

  console.info("[ENRICHED_ANALYSIS] Completed", {
    bin: input.bin.slice(0, 4) + "**",
    successApis: successCount,
    totalApis,
    overallConfidence,
  })

  return {
    sessionRisk,
    ipProbe,
    fraudLabs,
    mastercardIdentity,
    mastercardFraud,
    dataProvenance,
    apiDiagnostics: diagnostics,
  }
}
