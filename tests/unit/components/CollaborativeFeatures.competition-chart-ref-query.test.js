import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const source = readFileSync(
  resolve(__dirname, '../../../src/components/CollaborativeFeatures.vue'),
  'utf8'
)

describe('CollaborativeFeatures — gráfico de competição procura atributo DOM ref', () => {
  it('o canvas usa :ref Vue e o onMounted busca [ref=...] no document — o seletor nunca acha o canvas', () => {
    expect(source).toMatch(/<canvas :ref="`competition-chart-\$\{competition\.id\}`"/)
    expect(source).toMatch(
      /document\.querySelector\(`\[ref="competition-chart-\$\{competition\.id\}"\]`\)/
    )

    const mounted = source.slice(
      source.indexOf('onMounted(() => {'),
      source.indexOf('return {')
    )
    expect(mounted).toMatch(/new Chart\(canvas/)
    expect(mounted).not.toMatch(/\$refs|getCurrentInstance|competitionCharts/)
  })

  it('diretiva :ref não vira atributo HTML — querySelector("[ref=...]") devolve null e o Chart.js não inicializa', () => {
    const previous = document.body.innerHTML
    document.body.innerHTML = '<canvas class="performance-chart"></canvas>'
    try {
      expect(document.querySelector('[ref="competition-chart-1"]')).toBeNull()
      expect(document.querySelector('canvas.performance-chart')).not.toBeNull()
    } finally {
      document.body.innerHTML = previous
    }
  })
})
