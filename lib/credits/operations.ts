import { createClient } from "@/lib/supabase/server"

export type CreditOperation = "add" | "subtract" | "reset" | "purchase"
export type OperationType = "verification" | "purchase" | "refund" | "bonus"

export interface CreditOperationResult {
  success: boolean
  message: string
  newBalance?: number
  transactionId?: string
}

interface CreditRpcResponseRow {
  success: boolean
  message: string
  new_balance: number | null
  transaction_id: string | null
}

export async function getUserCredits(userId: string): Promise<number | null> {
  const supabase = await createClient()

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
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc("process_credit_operation", {
      p_user_id: userId,
      p_operation: "add",
      p_amount: amount,
      p_description: description,
      p_operation_type: operationType,
    })

    if (error) throw error

    const rpcResult = (data as CreditRpcResponseRow[] | null)?.[0]
    if (!rpcResult?.success) {
      return { success: false, message: rpcResult?.message || "Failed to add credits" }
    }

    return {
      success: true,
      message: rpcResult.message,
      newBalance: rpcResult.new_balance ?? undefined,
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
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc("process_credit_operation", {
      p_user_id: userId,
      p_operation: "subtract",
      p_amount: amount,
      p_description: description,
      p_operation_type: operationType,
    })

    if (error) throw error

    const rpcResult = (data as CreditRpcResponseRow[] | null)?.[0]
    if (!rpcResult?.success) {
      return { success: false, message: rpcResult?.message || "Failed to use credits" }
    }

    return {
      success: true,
      message: rpcResult.message,
      newBalance: rpcResult.new_balance ?? undefined,
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
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc("process_credit_operation", {
      p_user_id: userId,
      p_operation: "reset",
      p_amount: newAmount,
      p_description: description,
      p_operation_type: "bonus",
    })

    if (error) throw error

    const rpcResult = (data as CreditRpcResponseRow[] | null)?.[0]
    if (!rpcResult?.success) {
      return { success: false, message: rpcResult?.message || "Failed to reset credits" }
    }

    return {
      success: true,
      message: rpcResult.message,
      newBalance: rpcResult.new_balance ?? undefined,
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
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc("process_credit_operation", {
      p_user_id: userId,
      p_operation: "purchase",
      p_amount: creditAmount,
      p_description: `Purchased ${creditAmount} credits`,
      p_operation_type: "purchase",
      p_payment_amount: paymentAmount,
      p_payment_method: paymentMethod,
      p_payment_reference: paymentReference,
    })

    if (error) throw error

    const rpcResult = (data as CreditRpcResponseRow[] | null)?.[0]
    if (!rpcResult?.success) {
      return { success: false, message: rpcResult?.message || "Failed to purchase credits" }
    }

    return {
      success: true,
      message: rpcResult.message,
      newBalance: rpcResult.new_balance ?? undefined,
      transactionId: rpcResult.transaction_id ?? undefined,
    }
  } catch (error) {
    console.error("[v0] Error purchasing credits:", error)
    return { success: false, message: "Failed to purchase credits" }
  }
}

export async function getToolCost(toolName: string): Promise<number> {
  const supabase = await createClient()

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
