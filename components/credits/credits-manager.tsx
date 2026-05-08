"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, Plus, Minus, RotateCcw, AlertCircle, History } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface CreditsManagerProps {
  userId: string
  isAdmin?: boolean
  initialCredits?: number
}

export function CreditsManager({ userId: _userId, isAdmin = false, initialCredits = 0 }: CreditsManagerProps) {
  const [credits, setCredits] = useState(initialCredits)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [operation, setOperation] = useState<"add" | "subtract" | "reset">("add")

  // Fetch current credits
  const fetchCredits = async () => {
    try {
      const response = await fetch("/api/credits/balance")
      if (response.ok) {
        const data = await response.json()
        setCredits(data.credits)
      }
    } catch (error) {
      console.error("[v0] Error fetching credits:", error)
    }
  }

  useEffect(() => {
    fetchCredits()
  }, [])

  const handleOperation = async () => {
    if (!amount || Number.parseInt(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/credits/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          amount: Number.parseInt(amount),
          description: description || `Credits ${operation}`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setCredits(result.newBalance || credits)
        setAmount("")
        setDescription("")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("[v0] Error performing operation:", error)
      toast.error("Failed to perform operation")
    } finally {
      setLoading(false)
    }
  }

  const creditPackages = [
    { credits: 100, price: 9.99, popular: false },
    { credits: 500, price: 39.99, popular: true },
    { credits: 1000, price: 69.99, popular: false },
    { credits: 2500, price: 149.99, popular: false },
  ]

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Current Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary mb-2">{credits}</div>
          <p className="text-muted-foreground">Available credits</p>
          <div className="flex items-center space-x-4 mt-4">
            <Button onClick={fetchCredits} variant="outline" size="sm" className="bg-transparent">
              Refresh Balance
            </Button>
            <Link href="/dashboard/credits/history">
              <Button variant="outline" size="sm" className="bg-transparent">
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase">Purchase Credits</TabsTrigger>
          {isAdmin && <TabsTrigger value="manage">Manage Credits</TabsTrigger>}
        </TabsList>

        {/* Purchase Credits Tab */}
        <TabsContent value="purchase" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Packages</CardTitle>
              <CardDescription>Choose a package that fits your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPackages.map((pkg) => (
                  <Card key={pkg.credits} className={`relative ${pkg.popular ? "border-primary" : ""}`}>
                    {pkg.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2" variant="default">
                        Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">{pkg.credits}</CardTitle>
                      <CardDescription>Credits</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-3xl font-bold mb-4">${pkg.price}</div>
                      <Button className="w-full" disabled={loading}>
                        Purchase
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        ${(pkg.price / pkg.credits).toFixed(3)} per credit
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Management Tab */}
        {isAdmin && (
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span>Admin Credit Management</span>
                </CardTitle>
                <CardDescription>Manage user credits (Admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="operation">Operation</Label>
                    <Select value={operation} onValueChange={(value: any) => setOperation(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">
                          <div className="flex items-center space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>Add Credits</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="subtract">
                          <div className="flex items-center space-x-2">
                            <Minus className="h-4 w-4" />
                            <span>Subtract Credits</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="reset">
                          <div className="flex items-center space-x-2">
                            <RotateCcw className="h-4 w-4" />
                            <span>Reset Credits</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Reason for credit adjustment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleOperation} disabled={loading || !amount} className="w-full">
                  {loading ? "Processing..." : `${operation.charAt(0).toUpperCase() + operation.slice(1)} Credits`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
