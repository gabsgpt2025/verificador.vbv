import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

import {
  buildTransactionContextForRequest,
  TransactionContextForm,
  type TransactionContextFormValue,
} from '@/components/premium-3-0/TransactionContextForm'

describe('TransactionContextForm', () => {
  it('renderiza o formulário colapsável com label principal', () => {
    const html = renderToStaticMarkup(
      createElement(TransactionContextForm, {
        value: {
          amount: '',
          currency: 'BRL',
          merchantCountry: 'OUTROS',
          mcc: '',
          isFirstTransaction: true,
        },
        onChange: () => {},
      }),
    )

    expect(html).toContain('Contexto avançado da transação')
    expect(html).toContain('data-state="closed"')
  })

  it('converte valores preenchidos para o payload de request', () => {
    const value: TransactionContextFormValue = {
      amount: '123.45',
      currency: 'USD',
      merchantCountry: 'BR',
      mcc: '7995',
      isFirstTransaction: false,
    }

    expect(buildTransactionContextForRequest(value)).toEqual({
      amount: 12345,
      currency: 'USD',
      merchantCountry: 'BR',
      mcc: '7995',
      isFirstTransaction: false,
    })
  })
})
