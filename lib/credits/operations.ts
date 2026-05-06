import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export type CreditOperation = "add" | "subtract" | "reset" | "purchase"
export type OperationType = "verification" | "purchase" | "refund" | "bonus"

export interface CreditOperationResult {
  success: boolean
  message: string
  newBalance?: number
  transactionId?: string
}

export async function getUserCredits(userId: string): Promise<number | null> {
  const supabase = createServerClient(cookies())

  const { data, error } = await supabase.from("users").select("credits").eq("id", userId).single()

  if (error) {
    console.error("[v0] Error fetching user credits:", error)
    return null
  }

  return data.credits
}

export async function addCredits(
  userId: string,
  amount: number,
  description = "Credits added",
  operationType: OperationType = "bonus",
): Promise<CreditOperationResult> {
  const supabase = createServerClient(cookies())

  try {
    // Get current credits
    const currentCredits = await getUserCredits(userId)
    if (currentCredits === null) {
      return { success: false, message: "User not found" }
    }

    const newBalance = currentCredits + amount

    // Update user credits
    const { error: updateError } = await supabase
      .from("users")
      .update({
        credits: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) throw updateError

    // Log the operation
    const { error: logError } = await supabase.from("user_credits_log").insert({
      user_id: userId,
      credits_before: currentCredits,
      credits_after: newBalance,
      credits_used: amount,
      operation_type: operationType,
      description,
    })

    if (logError) throw logError

    return {
      success: true,
      message: `Successfully added ${amount} credits`,
      newBalance,
    }
  } catch (error) {
    console.error("[v0] Error adding credits:", error)
    return { success: false, message: "Failed to add credits" }
  }
}

export async function subtractCredits(
  userId: string,
  amount: number,
  description = "Credits used",
  operationType: OperationType = "verification",
): Promise<CreditOperationResult> {
  const supabase = createServerClient(cookies())

  try {
    // Get current credits
    const currentCredits = await getUserCredits(userId)
    if (currentCredits === null) {
      return { success: false, message: "User not found" }
    }

    if (currentCredits < amount) {
      return { success: false, message: "Insufficient credits" }
    }

    const newBalance = currentCredits - amount

    // Update user credits
    const { error: updateError } = await supabase
      .from("users")
      .update({
        credits: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) throw updateError

    // Log the operation
    const { error: logError } = await supabase.from("user_credits_log").insert({
      user_id: userId,
      credits_before: currentCredits,
      credits_after: newBalance,
      credits_used: -amount, // Negative for subtraction
      operation_type: operationType,
      description,
    })

    if (logError) throw logError

    return {
      success: true,
      message: `Successfully used ${amount} credits`,
      newBalance,
    }
  } catch (error) {
    console.error("[v0] Error subtracting credits:", error)
    return { success: false, message: "Failed to use credits" }
  }
}

export async function resetCredits(
  userId: string,
  newAmount = 100,
  description = "Credits reset",
): Promise<CreditOperationResult> {
  const supabase = createServerClient(cookies())

  try {
    // Get current credits
    const currentCredits = await getUserCredits(userId)
    if (currentCredits === null) {
      return { success: false, message: "User not found" }
    }

    // Update user credits
    const { error: updateError } = await supabase
      .from("users")
      .update({
        credits: newAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) throw updateError

    // Log the operation
    const { error: logError } = await supabase.from("user_credits_log").insert({
      user_id: userId,
      credits_before: currentCredits,
      credits_after: newAmount,
      credits_used: newAmount - currentCredits,
      operation_type: "bonus",
      description,
    })

    if (logError) throw logError

    return {
      success: true,
      message: `Credits reset to ${newAmount}`,
      newBalance: newAmount,
    }
  } catch (error) {
    console.error("[v0] Error resetting credits:", error)
    return { success: false, message: "Failed to reset credits" }
  }
}

export async function purchaseCredits(
  userId: string,
  creditAmount: number,
  paymentAmount: number,
  paymentMethod = "stripe",
  paymentReference?: string,
): Promise<CreditOperationResult> {
  const supabase = createServerClient(cookies())

  try {
    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        transaction_type: "credit_purchase",
        amount: paymentAmount,
        credits: creditAmount,
        status: "completed",
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Add credits to user account
    const result = await addCredits(userId, creditAmount, `Purchased ${creditAmount} credits`, "purchase")

    if (result.success) {
      return {
        ...result,
        transactionId: transaction.id,
      }
    }

    return result
  } catch (error) {
    console.error("[v0] Error purchasing credits:", error)
    return { success: false, message: "Failed to purchase credits" }
  }
}

export async function getToolCost(toolName: string): Promise<number> {
  const supabase = createServerClient(cookies())

  const { data, error } = await supabase
    .from("tools")
    .select("credits_cost")
    .eq("name", toolName)
    .eq("is_active", true)
    .single()

  if (error || !data) {
    console.error("[v0] Error fetching tool cost:", error)
    return 1 // Default cost
  }

  return data.credits_cost
}
