"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CreditCard, MapPin, AlertCircle, CheckCircle, Coins } from "lucide-react"
import { toast } from "sonner"

interface BinVerificationWidgetProps {
  userId: string
}

interface VerificationResult {
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

// TEMPORARY: Testing mode — credits check disabled
const TESTING_MODE = true

export function BinVerificationWidget({ userId }: BinVerificationWidgetProps) {
  const [binNumber, setBinNumber] = useState("")
  const [verificationType, setVerificationType] = useState("basic")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState<number>(TESTING_MODE ? 9999 : 0)

  const fetchUserCredits = async () => {
    try {
      const response = await fetch("/api/credits/balance")
      if (response.ok) {
        const data = await response.json()
        setUserCredits(data.credits)
      }
    } catch (error) {
      console.error("[v0] Error fetching credits:", error)
    }
  }

  useEffect(() => {
    fetchUserCredits()
  }, [])

  const getVerificationCost = (type: string) => {
    switch (type) {
      case "basic":
        return 1
      case "advanced":
        return 2
      case "premium":
        return 3
      default:
        return 1
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!binNumber || binNumber.length < 6) {
      setError("Please enter at least 6 digits")
      return
    }

    const cost = getVerificationCost(verificationType)
    // TEMPORARY: Skip credit check in testing mode
    if (!TESTING_MODE && userCredits < cost) {
      setError(`Insufficient credits. You need ${cost} credits for ${verificationType} verification.`)
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/bin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          binNumber,
          verificationType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      if (data.success) {
        setResult(data.result)
        setUserCredits(data.newBalance)
        toast.success(`Verification completed! ${data.creditsUsed} credits used.`)
      }
    } catch (error: any) {
      setError(error.message || "Verification failed")
      toast.error(error.message || "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Coins className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Available Credits: {userCredits}</span>
        </div>
        <Button onClick={fetchUserCredits} variant="ghost" size="sm">
          Refresh
        </Button>
      </div>

      <form onSubmit={handleVerification} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bin">BIN Number</Label>
          <Input
            id="bin"
            type="text"
            placeholder="Enter first 6-8 digits of card number"
            value={binNumber}
            onChange={(e) => setBinNumber(e.target.value.replace(/\D/g, "").slice(0, 8))}
            maxLength={8}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">Enter the first 6-8 digits of a card number (BIN)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verification-type">Verification Type</Label>
          <Select value={verificationType} onValueChange={setVerificationType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">
                <div className="flex items-center justify-between w-full">
                  <span>Basic Verification</span>
                  <Badge variant="secondary" className="ml-2">
                    1 credit
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="advanced">
                <div className="flex items-center justify-between w-full">
                  <span>Advanced Verification</span>
                  <Badge variant="secondary" className="ml-2">
                    2 credits
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="premium">
                <div className="flex items-center justify-between w-full">
                  <span>Premium Verification</span>
                  <Badge variant="secondary" className="ml-2">
                    3 credits
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Higher tiers provide more detailed information and additional data points
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isLoading || !binNumber || (!TESTING_MODE && userCredits < getVerificationCost(verificationType))}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Verify BIN ({getVerificationCost(verificationType)} credit
              {getVerificationCost(verificationType) > 1 ? "s" : ""})
            </>
          )}
        </Button>
      </form>

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Verification Successful</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">BIN Number</Label>
                  <p className="font-mono font-medium">{result.bin_number}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Card Brand</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{result.card_brand}</Badge>
                    <Badge variant="outline">{result.card_type}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Card Level</Label>
                  <p className="font-medium">{result.card_level}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Issuer</Label>
                  <p className="font-medium">{result.issuer_name}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {result.issuer_country} ({result.issuer_country_code})
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Contact</Label>
                  <div className="space-y-1">
                    {result.issuer_website && (
                      <p className="text-sm text-primary hover:underline">
                        <a href={result.issuer_website} target="_blank" rel="noopener noreferrer">
                          {result.issuer_website}
                        </a>
                      </p>
                    )}
                    {result.issuer_phone && <p className="text-sm font-mono">{result.issuer_phone}</p>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
