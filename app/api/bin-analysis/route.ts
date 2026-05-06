import { type NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { xai } from "@ai-sdk/xai"
import { MLRiskScoring } from "@/lib/bin-analysis/ml-scoring"
import { CurrencyConverter } from "@/lib/bin-analysis/currency-converter"
import type { BINAnalysisRequest, BINAnalysisResult } from "@/lib/bin-analysis/types"
import { createClient } from "@/lib/supabase/server"
import { subtractCredits } from "@/lib/credits/operations"

export async function POST(request: NextRequest) {
  try {
    const { bin, amount = 100, currency = "USD" }: BINAnalysisRequest = await request.json()

    if (!bin || bin.length < 6) {
      return NextResponse.json({ error: "Valid BIN (6+ digits) is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check and deduct credits (BIN Pro costs 3 credits)
    const creditResult = await subtractCredits(user.id, 3, "BIN Pro 2.0 Analysis", `BIN: ${bin}`)
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error }, { status: 400 })
    }

    const startTime = Date.now()

    // Simulate BIN lookup (in production, use real BIN API)
    const binData = await simulateBINLookup(bin)

    // Calculate ML risk score
    const riskScore = MLRiskScoring.calculateRiskScore(bin, binData.country, binData.bank, binData.type)
    const riskLevel = MLRiskScoring.getRiskLevel(riskScore)

    // Generate AI analysis
    const aiAnalysis = await generateAIAnalysis(bin, binData, riskScore)

    // Convert currencies
    const conversions = CurrencyConverter.convertToMultipleCurrencies(amount, currency)

    const processingTime = Date.now() - startTime

    const result: BINAnalysisResult = {
      bin,
      ...binData,
      riskScore,
      riskLevel,
      analysis: {
        aiInsights: aiAnalysis.insights,
        fraudIndicators: aiAnalysis.indicators,
        recommendations: aiAnalysis.recommendations,
        bypassProbability: aiAnalysis.bypassProbability,
        threeDSStatus: aiAnalysis.threeDSStatus,
        vbvStatus: aiAnalysis.vbvStatus,
      },
      conversions,
      metadata: {
        analysisDate: new Date().toISOString(),
        processingTime,
        confidence: aiAnalysis.confidence,
      },
    }

    // Save to history
    await saveAnalysisToHistory(user.id, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("BIN Analysis error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}

async function simulateBINLookup(bin: string) {
  // Simulated BIN data - in production, use real BIN API
  const brands = ["VISA", "MASTERCARD", "AMEX", "DISCOVER"]
  const types = ["credit", "debit", "prepaid"]
  const levels = ["STANDARD", "GOLD", "PLATINUM", "BLACK"]
  const countries = ["US", "CA", "GB", "DE", "FR", "AU", "BR", "MX"]
  const banks = ["CHASE BANK", "WELLS FARGO", "BANK OF AMERICA", "CITIBANK"]

  return {
    brand: brands[Number.parseInt(bin[0]) % brands.length],
    type: types[Number.parseInt(bin[1]) % types.length],
    level: levels[Number.parseInt(bin[2]) % levels.length],
    bank: banks[Number.parseInt(bin[3]) % banks.length],
    country: countries[Number.parseInt(bin[4]) % countries.length],
    currency: "USD",
  }
}

async function generateAIAnalysis(bin: string, binData: any, riskScore: number) {
  try {
    const prompt = `Analyze this BIN for fraud risk and security:
    
BIN: ${bin}
Brand: ${binData.brand}
Type: ${binData.type}
Bank: ${binData.bank}
Country: ${binData.country}
Risk Score: ${riskScore}/100

Provide analysis in JSON format:
{
  "insights": "Detailed AI insights about this BIN",
  "indicators": ["fraud indicator 1", "fraud indicator 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "bypassProbability": 0-100,
  "threeDSStatus": "ENABLED/DISABLED/PARTIAL",
  "vbvStatus": "ENABLED/DISABLED/PARTIAL",
  "confidence": 0-100
}`

    const result = await streamText({
      model: xai("grok-4"),
      prompt,
      system:
        "You are a financial fraud analysis expert. Provide detailed, accurate analysis in the requested JSON format.",
    })

    let fullResponse = ""
    for await (const chunk of result.textStream) {
      fullResponse += chunk
    }

    try {
      return JSON.parse(fullResponse)
    } catch {
      // Fallback if AI doesn't return valid JSON
      return {
        insights: `Advanced analysis of BIN ${bin} indicates ${riskScore > 60 ? "elevated" : "standard"} risk profile.`,
        indicators: riskScore > 60 ? ["High risk geography", "Unusual BIN pattern"] : ["Standard risk profile"],
        recommendations: ["Monitor transactions", "Apply standard verification"],
        bypassProbability: Math.min(riskScore + 10, 95),
        threeDSStatus: "ENABLED",
        vbvStatus: "ENABLED",
        confidence: 85,
      }
    }
  } catch (error) {
    console.error("AI Analysis error:", error)
    return {
      insights: "AI analysis temporarily unavailable. Using ML scoring.",
      indicators: ["Analysis pending"],
      recommendations: ["Standard verification recommended"],
      bypassProbability: riskScore,
      threeDSStatus: "UNKNOWN",
      vbvStatus: "UNKNOWN",
      confidence: 70,
    }
  }
}

async function saveAnalysisToHistory(userId: string, result: BINAnalysisResult) {
  const supabase = await createClient()

  await supabase.from("bin_verifications").insert({
    user_id: userId,
    bin: result.bin,
    verification_type: "BIN_PRO_2.0",
    result: result,
    risk_score: result.riskScore,
    credits_used: 3,
  })
}
