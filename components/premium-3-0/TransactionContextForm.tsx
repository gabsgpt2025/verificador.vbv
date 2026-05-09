'use client'

import { useState, type ReactNode } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { AlertTriangle, ChevronDown, Info, Wrench } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ISO_3166_COUNTRIES } from '@/lib/data/iso-3166'
import { ISO_4217_VERSION } from '@/lib/data/iso-4217'
import { ISO_3166_VERSION } from '@/lib/data/iso-3166'
import { MCC_DATASET_VERSION, MCC_EXPANSION_TODO } from '@/lib/data/mcc-codes'
import { cn } from '@/lib/utils'

import { CountrySelect } from './selects/CountrySelect'
import { CurrencySelect } from './selects/CurrencySelect'
import { HIGH_RISK_MCC, MccSelect } from './selects/MccSelect'

export type TransactionContextFormValue = {
  amount: string
  currency: string
  merchantCountry: string
  mcc: string
  isFirstTransaction: boolean
}

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
    currency: value.currency || undefined,
    merchantCountry: value.merchantCountry || undefined,
    mcc: value.mcc || undefined,
    isFirstTransaction: value.isFirstTransaction,
  }
}

export function getCountryName(code: string) {
  const found = ISO_3166_COUNTRIES.find((country) => country.code === code)
  return found?.namePtBr ?? code
}

export function getTransactionScope(issuerCountry: string | undefined, merchantCountry: string | undefined) {
  if (!issuerCountry || !merchantCountry) {
    return null
  }

  if (issuerCountry === merchantCountry) {
    return {
      kind: 'domestic' as const,
      label: 'Doméstica ✅',
      description: 'País do merchant igual ao país emissor do BIN.',
    }
  }

  return {
    kind: 'international' as const,
    label: 'Internacional ⚠️ (cross-border)',
    description: 'País do merchant diferente do país emissor do BIN.',
  }
}

type TransactionContextFormProps = {
  value: TransactionContextFormValue
  onChange: (next: TransactionContextFormValue) => void
  suggestedCurrency?: string
  suggestedMerchantCountry?: string
  issuerCountryCode?: string
}

export function TransactionContextForm({
  value,
  onChange,
  suggestedCurrency,
  suggestedMerchantCountry,
  issuerCountryCode,
}: TransactionContextFormProps) {
  const [open, setOpen] = useState(false)
  const transactionScope = getTransactionScope(issuerCountryCode, value.merchantCountry)
  const highRiskMcc = value.mcc ? HIGH_RISK_MCC.has(value.mcc) : false

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
            <Label htmlFor="transaction-currency" className="flex items-center gap-2">
              Moeda
              {suggestedCurrency && value.currency === suggestedCurrency ? (
                <Badge variant="info">Sugerido a partir do BIN — clique para alterar</Badge>
              ) : null}
            </Label>
            <CurrencySelect id="transaction-currency" value={value.currency} onChange={(currency) => onChange({ ...value, currency })} />
            <p className="text-xs text-muted-foreground">Fonte: {ISO_4217_VERSION}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant-country" className="flex items-center gap-2">
              País do merchant
              {suggestedMerchantCountry && value.merchantCountry === suggestedMerchantCountry ? (
                <Badge variant="info">Você pode alterar para transação internacional</Badge>
              ) : null}
            </Label>
            <CountrySelect id="merchant-country" value={value.merchantCountry} onChange={(merchantCountry) => onChange({ ...value, merchantCountry })} />
            <p className="text-xs text-muted-foreground">Fonte: {ISO_3166_VERSION}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant-mcc" className="flex items-center gap-2">
              MCC
              <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </Label>
            <MccSelect id="merchant-mcc" value={value.mcc} onChange={(mcc) => onChange({ ...value, mcc: sanitizeMcc(mcc) })} />
            <p className="text-xs text-muted-foreground">Fonte: {MCC_DATASET_VERSION}</p>
            <p className="text-xs text-muted-foreground">{MCC_EXPANSION_TODO}</p>
            <p className="text-xs text-muted-foreground">Dica: 5411 mercado, 5812 restaurante, 7995 gambling, 6051 cripto.</p>
          </div>
        </div>

        {transactionScope ? (
          <AlertBox tone={transactionScope.kind === 'domestic' ? 'success' : 'warning'} title={transactionScope.label} description={transactionScope.description} />
        ) : (
          <p className="text-xs text-muted-foreground">
            Informe país do merchant para distinguir transação doméstica de internacional.
          </p>
        )}

        {highRiskMcc ? (
          <AlertBox
            tone="warning"
            title="Categoria de alto risco"
            description="Categoria de alto risco — pode aumentar o score de fraude."
            icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
          />
        ) : null}

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

type AlertBoxProps = {
  tone: 'success' | 'warning'
  title: string
  description: string
  icon?: ReactNode
}

function AlertBox({ tone, title, description, icon }: AlertBoxProps) {
  return (
    <div className={cn('rounded-md border px-3 py-2 text-sm', tone === 'success' ? 'border-status-success/40 bg-status-success/10 text-status-success' : 'border-status-warning/40 bg-status-warning/10 text-status-warning')}>
      <p className="flex items-center gap-2 font-medium">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-xs">{description}</p>
    </div>
  )
}

export default TransactionContextForm
