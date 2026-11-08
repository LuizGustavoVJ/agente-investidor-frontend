import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const html = readFileSync(
  resolve(__dirname, '../../../index.html'),
  'utf8'
)

const configuracoes = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)

const dashboard = readFileSync(
  resolve(__dirname, '../../../src/components/Dashboard.vue'),
  'utf8'
)

describe('index.html — lang en e título genérico num app pt-BR', () => {
  it('html lang="en" — date-fns usa ptBR e Configurações tem type=date/number herdando locale en', () => {
    expect(html).toMatch(/<html lang="en">/)
    expect(html).not.toMatch(/lang=["']pt/)
    expect(html).not.toMatch(/hreflang/)

    expect(dashboard).toMatch(/date-fns\/locale/)
    expect(dashboard).toMatch(/ptBR/)
    expect(configuracoes).toMatch(/type="date"/)
    expect(configuracoes).toMatch(/type="number"/)
  })

  it('title inicial é Vite + Vue — password manager e first paint não veem Agente Investidor', () => {
    expect(html).toMatch(/<title>Vite \+ Vue<\/title>/)
    expect(html).not.toMatch(/Agente Investidor/)
  })
})
