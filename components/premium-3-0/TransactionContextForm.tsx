'use client'

import { useState } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown, Info, Wrench } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export type TransactionContextFormValue = {
  amount: string
  currency: 'BRL' | 'USD' | 'EUR' | 'GBP'
  merchantCountry: string
  mcc: string
  isFirstTransaction: boolean
}

export const MERCHANT_COUNTRY_OPTIONS = [
  'BR', 'US', 'GB', 'DE', 'FR', 'ES', 'IT', 'PT', 'NL', 'BE',
  'CA', 'MX', 'AR', 'CL', 'CO', 'PE', 'JP', 'CN', 'IN', 'AU', 'OUTROS',
] as const

export function sanitizeMcc(value: string) {
  return value.replace(/\D/g, '').slice(0, 4)
}

export type RequestTransactionContext = {
  amount?: number
  currency?: string
  merchantCountry?: string
  mcc?: string
  isFirstTransaction?: boolean
}

export function buildTransactionContextForRequest(value: TransactionContextFormValue): RequestTransactionContext {
  const parsedAmount = value.amount.trim() ? Number(value.amount.replace(',', '.')) : null
  const amount = parsedAmount !== null && !Number.isNaN(parsedAmount) ? Math.round(parsedAmount * 100) : undefined

  return {
    amount,
    currency: value.currency,
    merchantCountry: value.merchantCountry && value.merchantCountry !== 'OUTROS' ? value.merchantCountry : undefined,
    mcc: value.mcc || undefined,
    isFirstTransaction: value.isFirstTransaction,
  }
}

type TransactionContextFormProps = {
  value: TransactionContextFormValue
  onChange: (next: TransactionContextFormValue) => void
}

export function TransactionContextForm({ value, onChange }: TransactionContextFormProps) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="rounded-lg border border-border bg-card/50 p-4">
      <Collapsible.Trigger className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-foreground">
        <span className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-ds-accent" aria-hidden="true" />
          Contexto avançado da transação (opcional — melhora a precisão da análise)
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </Collapsible.Trigger>

      <Collapsible.Content className="mt-4 space-y-4 border-t border-border pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="transaction-amount">Valor da transação</Label>
            <Input
              id="transaction-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={value.amount}
              onChange={(event) => onChange({ ...value, amount: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-currency">Moeda</Label>
            <Select value={value.currency} onValueChange={(currency) => onChange({ ...value, currency: currency as TransactionContextFormValue['currency'] })}>
              <SelectTrigger id="transaction-currency" className="w-full">
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent>
                {['BRL', 'USD', 'EUR', 'GBP'].map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant-country">País do merchant</Label>
            <Select value={value.merchantCountry || 'OUTROS'} onValueChange={(merchantCountry) => onChange({ ...value, merchantCountry })}>
              <SelectTrigger id="merchant-country" className="w-full">
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
              <SelectContent>
                {MERCHANT_COUNTRY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant-mcc" className="flex items-center gap-2">
              MCC
              <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </Label>
            <Input
              id="merchant-mcc"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="Ex.: 5411"
              value={value.mcc}
              onChange={(event) => onChange({ ...value, mcc: sanitizeMcc(event.target.value) })}
            />
            <p className="text-xs text-muted-foreground">MCCs comuns: 5411 mercado, 5812 restaurante, 7995 gambling, 6051 cripto.</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Primeira transação deste cartão</p>
            <p className="text-xs text-muted-foreground">Ative quando não houver histórico conhecido para esta combinação.</p>
          </div>
          <Switch
            checked={value.isFirstTransaction}
            onCheckedChange={(isFirstTransaction) => onChange({ ...value, isFirstTransaction })}
            aria-label="Primeira transação"
          />
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

export default TransactionContextForm
