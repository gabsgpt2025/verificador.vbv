'use client'

import { useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type ComboOption = {
  value: string
  label: string
  searchText: string
  meta?: string
  group?: string
  highRisk?: boolean
}

type CommandComboBoxProps = {
  id?: string
  value: string
  options: ComboOption[]
  placeholder: string
  searchPlaceholder: string
  emptyLabel: string
  onChange: (value: string) => void
  disabled?: boolean
  sourceLabel?: string
}

export function filterOptions(options: ComboOption[], query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return options
  return options.filter((option) => option.searchText.includes(normalized))
}

export function CommandComboBox({
  id,
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  onChange,
  disabled,
  sourceLabel,
}: CommandComboBoxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => filterOptions(options, query), [options, query])
  const parentRef = useRef<HTMLDivElement | null>(null)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" disabled={disabled}>
          <span className="truncate text-left">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <div ref={parentRef} className="max-h-72 overflow-auto" aria-label={sourceLabel}>
              {filtered.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(next) => {
                    onChange(next)
                    setOpen(false)
                  }}
                  className={cn(option.highRisk && 'text-risk-high')}
                >
                  <Check className={cn('h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate">{option.label}</p>
                    {option.meta ? <p className="truncate text-xs text-fg-muted">{option.meta}</p> : null}
                  </div>
                </CommandItem>
              ))}
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default CommandComboBox
