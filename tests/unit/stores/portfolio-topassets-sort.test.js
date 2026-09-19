import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'

describe('Portfolio store — topAssets muta e ordena com NaN', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
  })

  it('sort in-place reordena o array original de assets', () => {
    store.assets = [
      { symbol: 'PETR4', currentValue: 1000 },
      { symbol: 'VALE3', currentValue: 8000 },
      { symbol: 'ITUB4', currentValue: 3000 }
    ]

    const ranked = store.topAssets

    expect(ranked[0].symbol).toBe('VALE3')
    expect(store.assets[0].symbol).toBe('VALE3')
    expect(store.assets.map(a => a.symbol)).toEqual(['VALE3', 'ITUB4', 'PETR4'])
  })

  it('ativo sem currentValue produz comparação NaN e pode ficar na frente', () => {
    store.assets = [
      { symbol: 'PETR4', currentValue: 5000 },
      { symbol: 'CASH' }
    ]

    const ranked = store.topAssets

    expect(ranked).toHaveLength(2)
    expect(ranked.some(asset => Number.isNaN(asset.currentValue) || asset.currentValue === undefined)).toBe(true)
  })
})
