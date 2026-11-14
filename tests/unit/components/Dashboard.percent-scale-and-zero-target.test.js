import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const source = readFileSync(
  resolve(__dirname, '../../../src/components/Dashboard.vue'),
  'utf8'
)

const formatPercent = (value) => {
  if (value === null || value === undefined) return '0,00%'

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

const getGoalProgress = (activeGoals, totalValue) => {
  if (activeGoals.length === 0) return 0

  const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const currentValue = totalValue

  return Math.min((currentValue / totalTarget) * 100, 100)
}

describe('Dashboard — escala de percentual e progresso de meta com alvo 0', () => {
  it('formatPercent divide por 100 e Intl style percent — 12 (12%) vira 12,00%, 0.12 vira 0,12%', () => {
    const fn = source.slice(
      source.indexOf('const formatPercent = (value) => {'),
      source.indexOf('const formatNumber = (value) => {')
    )

    expect(fn).toMatch(/style:\s*'percent'/)
    expect(fn).toMatch(/value \/ 100/)
    expect(fn).not.toMatch(/value \* 100/)
    expect(source).toMatch(/formatPercent\(totalGainPercent\)/)
    expect(source).toMatch(/formatPercent\(value\.percentage\)/)
    expect(source).toMatch(/formatPercent\(context\.parsed\)/)

    const twelve = formatPercent(12)
    const fraction = formatPercent(0.12)
    expect(twelve.replace(/\s/g, '')).toMatch(/12,00%/)
    expect(fraction.replace(/\s/g, '')).toMatch(/0,12%/)
  })

  it('getGoalProgress soma targetAmount (não targetValue) e alvo 0 vira 100% via Math.min(Infinity, 100)', () => {
    const fn = source.slice(
      source.indexOf('const getGoalProgress = () => {'),
      source.indexOf('const syncData = async () => {')
    )

    expect(fn).toMatch(/goal\.targetAmount/)
    expect(fn).not.toMatch(/targetValue/)
    expect(fn).toMatch(/Math\.min\(\(currentValue \/ totalTarget\) \* 100, 100\)/)
    expect(fn).not.toMatch(/totalTarget === 0|Number\.isFinite/)
    expect(source).toMatch(/width: `\$\{getGoalProgress\(\)\}%`/)

    expect(getGoalProgress([], 50000)).toBe(0)
    expect(getGoalProgress([{ targetAmount: 0 }], 50000)).toBe(100)
    expect(
      getGoalProgress([{ targetValue: 150000, currentValue: 45000 }], 45000)
    ).toBeNaN()
  })
})
