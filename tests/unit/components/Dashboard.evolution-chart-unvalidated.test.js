import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const source = readFileSync(
  resolve(__dirname, '../../../src/components/Dashboard.vue'),
  'utf8'
)

describe('Dashboard.createEvolutionChart — evolução sem Array.isArray nem data válida', () => {
  it('mapeia portfolioStore.evolution com .map e date-fns format, sem Array.isArray nem isValid', () => {
    const fn = source.slice(
      source.indexOf('const createEvolutionChart'),
      source.indexOf('const updateCharts')
    )

    expect(fn).toMatch(/const evolution = portfolioStore\.evolution/)
    expect(fn).toMatch(/evolution\.map\(point => format\(new Date\(point\.date\)/)
    expect(fn).toMatch(/evolution\.map\(point => point\.value\)/)
    expect(fn).not.toMatch(/Array\.isArray/)
    expect(fn).not.toMatch(/isValid|Number\.isNaN|Invalid Date/)
    expect(fn).not.toMatch(/try\s*\{/)
    expect(fn).not.toMatch(/formatDate\(/)
  })

  it('updateCharts chama createEvolutionChart num nextTick fora do try/catch de loadDashboardData', () => {
    expect(source).toMatch(/const updateCharts = \(\) => \{\s*nextTick\(\(\) => \{/)
    expect(source).toMatch(/createEvolutionChart\(\)/)

    const load = source.slice(
      source.indexOf('const loadDashboardData'),
      source.indexOf('// Lifecycle')
    )
    expect(load).toMatch(/updateCharts\(\)/)
    expect(load).toMatch(/} finally \{\s*isInitialLoading\.value = false/)
  })

  it('contrato objeto (em vez de array) e data inválida quebram o gráfico após o load', () => {
    const objectPayload = { points: [{ date: '2024-01-01', value: 1000 }] }
    expect(() => objectPayload.map((point) => point.value)).toThrow(TypeError)

    const invalid = new Date('not-a-date')
    expect(() => format(invalid, 'MMM', { locale: ptBR })).toThrow()
  })
})
