import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {}
}))

vi.mock('@/api/analysis', () => ({
  analysisAPI: {}
}))

describe('Getters das stores — imutabilidade da ordenação', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('topAssets não reordena o array original de ativos', () => {
    const store = usePortfolioStore()
    store.assets = [
      { symbol: 'ITUB4', currentValue: 100 },
      { symbol: 'VALE3', currentValue: 800 },
      { symbol: 'PETR4', currentValue: 500 }
    ]

    const originalOrder = store.assets.map((asset) => asset.symbol)
    expect(store.topAssets.map((asset) => asset.symbol)).toEqual(['VALE3', 'PETR4', 'ITUB4'])
    expect(store.assets.map((asset) => asset.symbol)).toEqual(originalOrder)
  })

  it('recentTransactions não reordena o array original de transações', () => {
    const store = usePortfolioStore()
    store.transactions = [
      { id: 1, date: '2026-01-01' },
      { id: 2, date: '2026-08-01' },
      { id: 3, date: '2026-03-15' }
    ]

    expect(store.recentTransactions.map((tx) => tx.id)).toEqual([2, 3, 1])
    expect(store.transactions.map((tx) => tx.id)).toEqual([1, 2, 3])
  })

  it('recentRecommendations não reordena o array original de recomendações', () => {
    const store = useAnalysisStore()
    store.recommendations = [
      { id: 'a', createdAt: '2026-01-01' },
      { id: 'b', createdAt: '2026-09-01' },
      { id: 'c', createdAt: '2026-03-01' }
    ]

    expect(store.recentRecommendations.map((item) => item.id)).toEqual(['b', 'c', 'a'])
    expect(store.recommendations.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('recentAnalyses não reordena o histórico original', () => {
    const store = useAnalysisStore()
    store.analysisHistory = [
      { id: 'old', createdAt: '2025-01-01' },
      { id: 'mid', createdAt: '2026-01-01' },
      { id: 'new', createdAt: '2026-08-01' }
    ]

    expect(store.recentAnalyses.map((item) => item.id)).toEqual(['new', 'mid', 'old'])
    expect(store.analysisHistory.map((item) => item.id)).toEqual(['old', 'mid', 'new'])
  })
})
