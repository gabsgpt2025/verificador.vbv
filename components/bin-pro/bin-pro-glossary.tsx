"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import { Book, Search } from "lucide-react"

const glossaryTerms = [
  {
    term: "BIN",
    definition: "Bank Identification Number - First 6-8 digits of a payment card that identify the issuing bank",
  },
  {
    term: "3DS",
    definition: "3D Secure - Authentication protocol that adds security layer for online card transactions",
  },
  {
    term: "VBV",
    definition: "Verified by Visa - Visa's implementation of 3D Secure authentication protocol",
  },
  {
    term: "Risk Score",
    definition: "ML-calculated score (0-100) indicating fraud probability based on multiple factors",
  },
  {
    term: "Bypass Probability",
    definition: "Likelihood that security measures (3DS/VBV) can be circumvented",
  },
  {
    term: "Issuing Bank",
    definition: "Financial institution that issued the payment card to the cardholder",
  },
  {
    term: "Card Level",
    definition: "Tier of the card (Standard, Gold, Platinum, Black) indicating benefits and limits",
  },
  {
    term: "Fraud Indicators",
    definition: "AI-identified patterns or characteristics that suggest potential fraudulent activity",
  },
]

export function BinProGlossary() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTerms = glossaryTerms.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 font-mono text-secondary neon-glow">
          <Book className="h-5 w-5" />
          <span>TECHNICAL GLOSSARY</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-mono"
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTerms.map((item, index) => (
            <div key={index} className="p-3 bg-muted/20 rounded-lg border border-border/50">
              <CyberText className="font-mono font-bold text-primary mb-1">{item.term}</CyberText>
              <CyberText variant="caption" color="muted" className="leading-relaxed">
                {item.definition}
              </CyberText>
            </div>
          ))}
        </div>

        {filteredTerms.length === 0 && (
          <CyberText color="muted" className="text-center py-4">
            No terms found matching "{searchTerm}"
          </CyberText>
        )}
      </CardContent>
    </Card>
  )
}
