import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('CollaborativeFeatures: copyAmount não entra na cópia', () => {
  const source = readFileSync(
    resolve(__dirname, '../../../src/components/CollaborativeFeatures.vue'),
    'utf8'
  )

  const copyTraderFn = source.slice(
    source.indexOf('const copyTrader ='),
    source.indexOf('const adjustCopy =')
  )

  it('copyTrader só alterna isFollowing/isCopying — não lê copyAmount nem autoRebalance', () => {
    expect(copyTraderFn).toMatch(/trader\.isCopying = !trader\.isCopying/)
    expect(copyTraderFn).toMatch(/trader\.isFollowing = true/)
    expect(copyTraderFn).not.toMatch(/copyAmount/)
    expect(copyTraderFn).not.toMatch(/autoRebalance/)
    expect(copyTraderFn).not.toMatch(/alert\(/)
    expect(copyTraderFn).not.toMatch(/fetch\(/)
    expect(copyTraderFn).not.toMatch(/portfolioAPI|brokersAPI|analysisAPI/)
  })

  it('min="100" existe só no input HTML — copyTrader não rejeita 0 nem valor negativo', () => {
    expect(source).toMatch(/v-model="trader\.copyAmount"/)
    expect(source).toMatch(/min="100"/)
    expect(copyTraderFn).not.toMatch(/<\s*100|>=\s*100|copyAmount/)
  })
})
