import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

import { Premium3DAnalyzer } from '@/components/premium-3-0/Premium3DAnalyzer'

describe('Premium3DAnalyzer display policy snapshots', () => {
  it('renderiza corretamente sem dados iniciais (estado idle)', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer))
    expect(html).toMatchSnapshot()
  })

  it('renderiza com userId fornecido', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer, { userId: 'user-456' } as any))
    expect(html).toContain('VeriFiBIN Premium 3.0')
    expect(html).toMatchSnapshot()
  })

  it('contém elementos essenciais de UI', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer))
    expect(html).toContain('Modo Técnico')
    expect(html).toContain('Modo Popular')
    expect(html).toContain('Analisar')
  })
})
