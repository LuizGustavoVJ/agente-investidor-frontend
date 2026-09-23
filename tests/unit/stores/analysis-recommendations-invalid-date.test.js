import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn(),
    runAnalysis: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    markAlertAsRead: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getAssetAnalysis: vi.fn(),
    getMarketAnalysis: vi.fn(),
    saveAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn(),
    deleteSavedAnalysis: vi.fn(),
    compareAssets: vi.fn(),
    getPortfolioOptimization: vi.fn()
  }
}))

import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis — recomendações e histórico com createdAt inválido', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('recentRecommendations inclui item com createdAt inválido e não lança', () => {
    const store = useAnalysisStore()
    store.recommendations = [
      { id: 1, createdAt: '2026-03-01', title: 'Comprar PETR4' },
      { id: 2, createdAt: 'invalid', title: 'Vender VALE3' },
      { id: 3, createdAt: '2026-01-01', title: 'Manter ITUB4' }
    ]

    expect(() => store.recentRecommendations).not.toThrow()
    expect(store.recentRecommendations).toHaveLength(3)
    expect(store.recentRecommendations.map((r) => r.id)).toContain(2)
  })

  it('recentRecommendations muta o array original via sort in-place', () => {
    const store = useAnalysisStore()
    const original = [
      { id: 1, createdAt: '2024-01-01' },
      { id: 2, createdAt: '2024-06-01' }
    ]
    store.recommendations = original

    const recent = store.recentRecommendations

    expect(recent[0].id).toBe(2)
    expect(original[0].id).toBe(2)
    expect(store.recommendations[0].id).toBe(2)
  })

  it('recentAnalyses com createdAt inválido não lança e mantém o item', () => {
    const store = useAnalysisStore()
    store.analysisHistory = [
      { id: 10, createdAt: '2026-02-01' },
      { id: 11, createdAt: '???' }
    ]

    expect(() => store.recentAnalyses).not.toThrow()
    expect(store.recentAnalyses.map((a) => a.id)).toContain(11)
  })
})
