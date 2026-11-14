import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const source = readFileSync(
  resolve(__dirname, '../../../src/components/CustomMethodologyBuilder.vue'),
  'utf8'
)

const resetAfterSave = (methodology) => {
  Object.keys(methodology).forEach((key) => {
    if (typeof methodology[key] === 'string') {
      methodology[key] = ''
    } else if (Array.isArray(methodology[key])) {
      methodology[key] = []
    }
  })
  return methodology
}

describe('CustomMethodologyBuilder.saveMethodology — reset ignora objeto aninhado', () => {
  it('depois de salvar, só zera string/array — riskManagement (stop, tamanho, concentração) permanece', () => {
    const fn = source.slice(
      source.indexOf('const saveMethodology = () => {'),
      source.indexOf('const editMethodology = (saved) => {')
    )

    expect(fn).toMatch(/Object\.keys\(methodology\)\.forEach/)
    expect(fn).toMatch(/typeof methodology\[key\] === 'string'/)
    expect(fn).toMatch(/Array\.isArray\(methodology\[key\]\)/)
    expect(fn).not.toMatch(/riskManagement/)
    expect(fn).not.toMatch(/entryLogic|exitLogic/)
    expect(fn).not.toMatch(/structuredClone|JSON\.parse|Object\.assign\(methodology,\s*\{/)
  })

  it('a próxima metodologia herda stop-loss e tamanho de posição; entryLogic vira string vazia', () => {
    const methodology = {
      name: 'Value Conservador',
      category: 'value',
      description: 'ações baratas',
      riskProfile: 'conservative',
      timeHorizon: 'long',
      criteria: [{ id: 'pe_ratio' }],
      entryRules: [{ type: 'price' }],
      exitRules: [{ type: 'stop' }],
      entryLogic: 'and',
      exitLogic: 'or',
      riskManagement: {
        maxPositionSize: 99,
        maxPositions: 3,
        maxSectorConcentration: 80,
        useStopLoss: true,
        globalStopLoss: 5
      }
    }

    resetAfterSave(methodology)

    expect(methodology.name).toBe('')
    expect(methodology.criteria).toEqual([])
    expect(methodology.entryRules).toEqual([])
    expect(methodology.entryLogic).toBe('')
    expect(methodology.exitLogic).toBe('')
    expect(methodology.riskManagement).toEqual({
      maxPositionSize: 99,
      maxPositions: 3,
      maxSectorConcentration: 80,
      useStopLoss: true,
      globalStopLoss: 5
    })
  })
})
