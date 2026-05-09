import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

import { Premium3DAnalyzer } from '@/components/premium-3-0/Premium3DAnalyzer'

describe('Premium3DAnalyzer smoke', () => {
  it('snapshot do layout inicial sem dados (estado idle)', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer))
    expect(html).toMatchSnapshot()
  })

  it('renderiza sem erros quando userId é fornecido', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer, { userId: 'user-123' } as any))
    expect(html).toContain('VeriFiBIN Premium 3.0')
    expect(html).toContain('Analisar')
  })

  it('contém campos de input e botão de análise', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer))
    expect(html).toContain('Insira o BIN')
    expect(html).toContain('Analisar')
    expect(html).toContain('Modo de Linguagem')
  })
})
