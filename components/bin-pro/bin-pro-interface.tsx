"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import { BinAnalysisCards } from "./bin-analysis-cards"
import { BinProGlossary } from "./bin-pro-glossary"
import { BinProHistory } from "./bin-pro-history"
import type { BINAnalysisResult } from "@/lib/bin-analysis/types"
import { Search, Loader2, AlertTriangle, CheckCircle, XCircle, Brain } from "lucide-react"

interface BinProInterfaceProps {
  userId: string
}

export function BinProInterface({ userId }: BinProInterfaceProps) {
  const [bin, setBin] = useState("")
  const [amount, setAmount] = useState("100")
  const [currency, setCurrency] = useState("USD")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<BINAnalysisResult | null>(null)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    if (!bin || bin.length < 6) {
      setError("Please enter a valid BIN (6+ digits)")
      return
    }

    setIsAnalyzing(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/bin-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bin: bin.replace(/\s/g, ""),
          amount: Number.parseFloat(amount) || 100,
          currency,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const analysisResult = await response.json()
      setResult(analysisResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "default"
      case "MEDIUM":
        return "secondary"
      case "HIGH":
        return "destructive"
      case "CRITICAL":
        return "destructive"
      default:
        return "default"
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return <CheckCircle className="h-4 w-4" />
      case "MEDIUM":
        return <AlertTriangle className="h-4 w-4" />
      case "HIGH":
        return <XCircle className="h-4 w-4" />
      case "CRITICAL":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Analysis Input */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-primary neon-glow">
            <Brain className="h-5 w-5" />
            <span>BIN PRO 2.0 ANALYSIS</span>
          </CardTitle>
          <CardDescription className="font-mono">
            Enter BIN details for comprehensive AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-mono font-medium mb-2">BIN Number</label>
              <Input
                placeholder="Enter BIN (6+ digits)"
                value={bin}
                onChange={(e) => setBin(e.target.value)}
                className="font-mono"
                maxLength={19}
              />
            </div>
            <div>
              <label className="block text-sm font-mono font-medium mb-2">Amount</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background font-mono"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <CyberText color="destructive" variant="caption">
                {error}
              </CyberText>
            </div>
          )}

          <Button onClick={handleAnalyze} disabled={isAnalyzing || !bin} className="w-full md:w-auto" variant="accent">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze BIN (3 Credits)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {result && (
        <div className="space-y-6">
          {/* Risk Overview */}
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between font-mono">
                <span className="text-primary neon-glow">ANALYSIS OVERVIEW</span>
                <Badge variant={getRiskBadgeVariant(result.riskLevel)} className="font-mono">
                  {getRiskIcon(result.riskLevel)}
                  <span className="ml-1">{result.riskLevel} RISK</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <CyberText variant="caption" color="muted">
                    BIN
                  </CyberText>
                  <CyberText className="font-mono font-bold">{result.bin}</CyberText>
                </div>
                <div>
                  <CyberText variant="caption" color="muted">
                    Brand
                  </CyberText>
                  <CyberText className="font-mono font-bold">{result.brand}</CyberText>
                </div>
                <div>
                  <CyberText variant="caption" color="muted">
                    Risk Score
                  </CyberText>
                  <CyberText className="font-mono font-bold text-accent">{result.riskScore}/100</CyberText>
                </div>
                <div>
                  <CyberText variant="caption" color="muted">
                    Confidence
                  </CyberText>
                  <CyberText className="font-mono font-bold text-secondary">{result.metadata.confidence}%</CyberText>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 8 Analysis Cards */}
          <BinAnalysisCards result={result} />
        </div>
      )}

      {/* Glossary and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BinProGlossary />
        <BinProHistory userId={userId} />
      </div>
    </div>
  )
}
