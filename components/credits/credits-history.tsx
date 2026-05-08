"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  History,
  Plus,
  Minus,
  CreditCard,
  Gift,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
} from "lucide-react"
import { format } from "date-fns"

interface CreditLogEntry {
  id: string
  credits_before: number
  credits_after: number
  credits_used: number
  operation_type: "verification" | "purchase" | "refund" | "bonus"
  description: string
  created_at: string
}

interface CreditsHistoryProps {
  userId: string
}

export function CreditsHistory({ userId: _userId }: CreditsHistoryProps) {
  const [history, setHistory] = useState<CreditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterType, setFilterType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchHistory = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      })

      const response = await fetch(`/api/credits/history?${params}`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error("[v0] Error fetching credits history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const getOperationIcon = (type: string) => {
    switch (type) {
      case "verification":
        return <CreditCard className="h-4 w-4 text-blue-500" />
      case "purchase":
        return <Plus className="h-4 w-4 text-green-500" />
      case "refund":
        return <RefreshCw className="h-4 w-4 text-orange-500" />
      case "bonus":
        return <Gift className="h-4 w-4 text-purple-500" />
      default:
        return <History className="h-4 w-4 text-gray-500" />
    }
  }

  const getOperationBadge = (type: string) => {
    const variants = {
      verification: "secondary",
      purchase: "default",
      refund: "outline",
      bonus: "secondary",
    } as const

    return (
      <Badge variant={variants[type as keyof typeof variants] || "outline"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const filteredHistory = history.filter((entry) => {
    const matchesType = filterType === "all" || entry.operation_type === filterType
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const exportHistory = () => {
    const csvContent = [
      ["Date", "Operation", "Credits Before", "Credits After", "Credits Used", "Description"].join(","),
      ...filteredHistory.map((entry) =>
        [
          format(new Date(entry.created_at), "yyyy-MM-dd HH:mm:ss"),
          entry.operation_type,
          entry.credits_before,
          entry.credits_after,
          entry.credits_used,
          `"${entry.description}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `credits-history-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5 text-primary" />
              <span>Credits History</span>
            </CardTitle>
            <CardDescription>Track all your credit transactions and usage</CardDescription>
          </div>
          <Button onClick={exportHistory} variant="outline" size="sm" disabled={filteredHistory.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operations</SelectItem>
              <SelectItem value="verification">Verifications</SelectItem>
              <SelectItem value="purchase">Purchases</SelectItem>
              <SelectItem value="refund">Refunds</SelectItem>
              <SelectItem value="bonus">Bonuses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* History Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredHistory.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead className="text-right">Before</TableHead>
                    <TableHead className="text-right">After</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {format(new Date(entry.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getOperationIcon(entry.operation_type)}
                          {getOperationBadge(entry.operation_type)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{entry.credits_before}</TableCell>
                      <TableCell className="text-right font-mono">{entry.credits_after}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span
                          className={`flex items-center justify-end space-x-1 ${
                            entry.credits_used > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {entry.credits_used > 0 ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          <span>{Math.abs(entry.credits_used)}</span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchHistory(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchHistory(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No transactions found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterType !== "all"
                ? "Try adjusting your filters"
                : "Your credit transactions will appear here"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
