import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { subtractCredits, getToolCost } from "@/lib/credits/operations"

interface BinVerificationResult {
  bin_number: string
  card_brand: string
  card_type: string
  card_level: string
  issuer_name: string
  issuer_country: string
  issuer_country_code: string
  issuer_website: string
  issuer_phone: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { binNumber, verificationType = "basic" } = body

    if (!binNumber || binNumber.length < 6) {
      return NextResponse.json({ error: "Invalid BIN number" }, { status: 400 })
    }

    // Get tool cost based on verification type
    const toolCost = await getToolCost(`bin_verification_${verificationType}`)

    // Check and subtract credits
    const creditResult = await subtractCredits(
      user.id,
      toolCost,
      `BIN verification for ${binNumber} (${verificationType})`,
      "verification",
    )

    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.message }, { status: 400 })
    }

    // Mock verification result (in production, this would call external API)
    const mockResult: BinVerificationResult = {
      bin_number: binNumber,
      card_brand: getBrandFromBin(binNumber),
      card_type: "Credit",
      card_level: verificationType === "premium" ? "Platinum" : "Classic",
      issuer_name: getIssuerFromBin(binNumber),
      issuer_country: "United States",
      issuer_country_code: "US",
      issuer_website: "https://example-bank.com",
      issuer_phone: "+1-800-123-4567",
    }

    // Save verification to database
    const { data: verification, error: insertError } = await supabase
      .from("bin_verifications")
      .insert({
        user_id: user.id,
        bin_number: binNumber,
        card_brand: mockResult.card_brand,
        card_type: mockResult.card_type,
        card_level: mockResult.card_level,
        issuer_name: mockResult.issuer_name,
        issuer_country: mockResult.issuer_country,
        issuer_country_code: mockResult.issuer_country_code,
        issuer_website: mockResult.issuer_website,
        issuer_phone: mockResult.issuer_phone,
        verification_result: mockResult,
        credits_used: toolCost,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error saving verification:", insertError)
      return NextResponse.json({ error: "Failed to save verification" }, { status: 500 })
    }

    // Log user activity
    await supabase.from("user_activity_logs").insert({
      user_id: user.id,
      activity_type: "bin_verification",
      activity_description: `Verified BIN ${binNumber} using ${verificationType} verification`,
      metadata: {
        bin_number: binNumber,
        verification_type: verificationType,
        credits_used: toolCost,
        verification_id: verification.id,
      },
    })

    return NextResponse.json({
      success: true,
      result: mockResult,
      creditsUsed: toolCost,
      newBalance: creditResult.newBalance,
      verificationId: verification.id,
    })
  } catch (error) {
    console.error("[v0] BIN verification API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getBrandFromBin(bin: string): string {
  const firstDigit = bin.charAt(0)
  const firstTwo = bin.substring(0, 2)

  if (firstDigit === "4") return "Visa"
  if (["51", "52", "53", "54", "55"].includes(firstTwo)) return "Mastercard"
  if (["34", "37"].includes(firstTwo)) return "American Express"
  if (firstTwo === "60") return "Discover"
  if (firstTwo === "35") return "JCB"

  return "Unknown"
}

function getIssuerFromBin(bin: string): string {
  const brands = {
    "4": ["Chase Bank", "Bank of America", "Wells Fargo", "Citibank"],
    "5": ["Capital One", "HSBC", "PNC Bank", "US Bank"],
    "3": ["American Express", "Diners Club"],
    "6": ["Discover Bank", "Barclays"],
  }

  const firstDigit = bin.charAt(0)
  const issuers = brands[firstDigit as keyof typeof brands] || ["Unknown Bank"]

  return issuers[Math.floor(Math.random() * issuers.length)]
}
