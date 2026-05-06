// lib/bin/analyzeThreeDS.ts
// Motor de análise 3DS/VBV — inferência baseada em regras técnicas

import type { BinApiData, ThreeDSAnalysis } from "./types"
import { getCountryMaturity } from "./country3dsMaturity"

function scoreBrand(brand?: string): number {
  if (!brand) return 0
  const b = brand.toUpperCase()
  if (["VISA", "MASTERCARD", "AMEX", "AMERICAN EXPRESS"].includes(b)) return 20
  return 5
}

function scoreType(type?: string): number {
  if (!type) return 0
  const t = type.toUpperCase()
  if (t === "CREDIT") return 20
  if (t === "DEBIT") return 5
  if (t === "PREPAID") return -25
  return 0
}

function scoreCategory(category?: string): number {
  if (!category) return -5
  const c = category.toUpperCase()
  if (["GOLD", "PLATINUM", "BLACK", "INFINITE", "SIGNATURE", "WORLD", "WORLD ELITE"].some((k) => c.includes(k)))
    return 15
  if (["BUSINESS", "CORPORATE", "COMMERCIAL", "ENTERPRISE"].some((k) => c.includes(k))) return 10
  if (c === "CLASSIC" || c === "STANDARD") return 0
  return -5
}

function scoreCountry(countryCode?: string): number {
  if (!countryCode) return -20
  const entry = getCountryMaturity(countryCode)
  if (!entry) return -10
  if (entry.maturity === "HIGH") return 25
  if (entry.maturity === "MEDIUM") return 10
  if (entry.maturity === "LOW") return -15
  return -10
}

function scoreIssuer(issuer?: string | null): number {
  if (issuer && issuer.trim().length > 0) return 10
  return -10
}

function inferProtocol(
  score: number,
  brand?: string,
  countryCode?: string,
): ThreeDSAnalysis["protocolLikely"] {
  const b = (brand ?? "").toUpperCase()
  const isMainBrand = ["VISA", "MASTERCARD", "AMEX", "AMERICAN EXPRESS"].includes(b)
  const entry = getCountryMaturity(countryCode)
  const isHighRegulatory =
    entry?.mandate === "PSD2_SCA" ||
    entry?.mandate === "SCA_STRONG" ||
    entry?.mandate === "STRONG_AUTH_REQUIRED" ||
    entry?.mandate === "STRONG_ADOPTION"

  if (score >= 45 && isMainBrand) {
    if (isHighRegulatory) return "EMV_3DS_2_2"
    return "EMV_3DS_2"
  }
  return "UNKNOWN"
}

export function analyzeThreeDS(binData: BinApiData): ThreeDSAnalysis {
  const score =
    scoreBrand(binData.brand) +
    scoreType(binData.type) +
    scoreCategory(binData.category) +
    scoreCountry(binData.countryCode) +
    scoreIssuer(binData.issuer)

  let status: ThreeDSAnalysis["status"]
  let confidence: ThreeDSAnalysis["confidence"]
  let challengeLikelihood: ThreeDSAnalysis["challengeLikelihood"]

  if (score >= 70) {
    status = "LIKELY_ACTIVE"
    confidence = "HIGH"
    challengeLikelihood = "HIGH"
  } else if (score >= 40) {
    status = "LIKELY_ACTIVE"
    confidence = "MEDIUM"
    challengeLikelihood = "MEDIUM"
  } else if (score >= 20) {
    status = "UNKNOWN"
    confidence = "LOW"
    challengeLikelihood = "UNKNOWN"
  } else {
    status = "LIKELY_INACTIVE"
    confidence = "LOW"
    challengeLikelihood = "LOW"
  }

  const protocolLikely = inferProtocol(score, binData.brand, binData.countryCode)

  const authMethodsLikely: string[] = []
  if (status === "LIKELY_ACTIVE") {
    authMethodsLikely.push("OTP")
    if (confidence === "HIGH") {
      authMethodsLikely.push("APP_PUSH", "BIOMETRIA")
    }
  }

  const explanation = buildExplanation(binData, status, confidence, score)

  return {
    status,
    confidence,
    challengeLikelihood,
    protocolLikely,
    authMethodsLikely,
    explanation,
    inferred: true,
  }
}

function buildExplanation(
  binData: BinApiData,
  status: ThreeDSAnalysis["status"],
  confidence: ThreeDSAnalysis["confidence"],
  score: number,
): string {
  const parts: string[] = []

  if (binData.brand) {
    parts.push(`Bandeira ${binData.brand}`)
  }
  if (binData.type) {
    parts.push(`cartão ${binData.type.toLowerCase()}`)
  }
  if (binData.countryName || binData.countryCode) {
    parts.push(`emitido em ${binData.countryName ?? binData.countryCode}`)
  }

  const maturity = getCountryMaturity(binData.countryCode)
  const maturityNote = maturity
    ? ` ${maturity.note}`
    : " País não identificado — maturidade 3DS desconhecida."

  const statusText =
    status === "LIKELY_ACTIVE"
      ? "suporte provável a autenticação 3DS/VBV"
      : status === "LIKELY_INACTIVE"
        ? "suporte incerto ou ausente a 3DS/VBV"
        : "status 3DS não determinado"

  const confidenceText = {
    HIGH: "com confiança alta",
    MEDIUM: "com confiança média",
    LOW: "com confiança baixa",
  }[confidence]

  const intro = parts.length > 0 ? `${parts.join(", ")}. ` : ""

  return (
    `${intro}Análise inferida indica ${statusText} ${confidenceText} (pontuação interna: ${score}).` +
    `${maturityNote} Esta análise é inferida por regras técnicas — não confirmada diretamente pela API.`
  )
}
