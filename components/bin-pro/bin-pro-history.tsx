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

export function BinProHistory({ userId }: BinProHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [userId])

  const fetchHistory = async () => {
    try {
      // Simulated history data - in production, fetch from API
      const mockHistory: HistoryItem[] = [
        {
          id: "1",
          bin: "424242",
          brand: "VISA",
          riskScore: 25,
          riskLevel: "LOW",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "2",
          bin: "555555",
          brand: "MASTERCARD",
          riskScore: 75,
          riskLevel: "HIGH",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: "3",
          bin: "378282",
          brand: "AMEX",
          riskScore: 45,
          riskLevel: "MEDIUM",
          createdAt: new Date(Date.now() - 259200000).toISOString(),
        },
      ]

      setHistory(mockHistory)
    } catch (error) {
      console.error("Failed to fetch history:", error)
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
                    {item.riskLevel}
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
