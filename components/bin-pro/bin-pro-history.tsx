"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import { History, TrendingUp, TrendingDown } from "lucide-react"

interface HistoryItem {
  id: string
  bin: string
  brand: string
  riskScore: number
  riskLevel: string
  createdAt: string
}

interface BinProHistoryProps {
  userId: string
}

interface BinAnalysisLogRow {
  id: string
  bin: string
  brand: string
  risk_score: number
  risk_level: string
  created_at: string
}

export function BinProHistory({ userId }: BinProHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [userId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/history")
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch history")
      }
      const data = await response.json()
      const items: HistoryItem[] = (data.history ?? []).map((row: BinAnalysisLogRow) => ({
        id: row.id,
        bin: row.bin,
        brand: row.brand,
        riskScore: row.risk_score,
        riskLevel: row.risk_level,
        createdAt: row.created_at,
      }))
      setHistory(items)
    } catch (err) {
      console.error("Failed to fetch history:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch history")
    } finally {
      setLoading(false)
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

  const getRiskTrend = (score: number) => {
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-destructive" />
    return <TrendingDown className="h-4 w-4 text-secondary" />
  }

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 font-mono text-accent neon-glow">
          <History className="h-5 w-5" />
          <span>ANALYSIS HISTORY</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <CyberText color="muted" className="text-center py-4">
            Loading history...
          </CyberText>
        ) : error ? (
          <CyberText color="muted" className="text-center py-4">
            {error}
          </CyberText>
        ) : history.length === 0 ? (
          <CyberText color="muted" className="text-center py-4">
            No analysis history yet
          </CyberText>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                    {getRiskTrend(item.riskScore)}
                  </div>
                  <div>
                    <CyberText className="font-mono font-bold">
                      {item.bin} • {item.brand}
                    </CyberText>
                    <CyberText variant="caption" color="muted">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </CyberText>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={getRiskBadgeVariant(item.riskLevel)} className="font-mono text-xs">
                    {item.riskLevel || "UNKNOWN"}
                  </Badge>
                  <CyberText variant="caption" color="muted" className="block">
                    {item.riskScore}/100
                  </CyberText>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
