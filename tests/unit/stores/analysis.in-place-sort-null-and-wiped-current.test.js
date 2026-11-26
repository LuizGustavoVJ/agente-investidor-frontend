import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getMarketAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn(),
    runAnalysis: vi.fn(),
    markAlertAsRead: vi.fn(),
    getAssetAnalysis: vi.fn(),
    saveAnalysis: vi.fn(),
    deleteSavedAnalysis: vi.fn(),
    compareAssets: vi.fn(),
    getPortfolioOptimization: vi.fn()
  }
}))

import { useAnalysisStore } from '@/stores/analysis'
import { analysisAPI } from '@/api/analysis'

const ok = (data) => ({ data: { success: true, data } })

describe('Analysis: sort in-place, listas null e currentAnalysis apagada', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('recentRecommendations ordena o array original in-place', () => {
    const original = [
      { id: 'old', createdAt: '2024-01-01T00:00:00.000Z', text: 'venda' },
      { id: 'new', createdAt: '2026-11-01T00:00:00.000Z', text: 'compra' }
    ]
    store.recommendations = original

    expect(store.recentRecommendations[0].id).toBe('new')
    expect(store.recommendations[0].id).toBe('new')
    expect(original[0].id).toBe('new')
  })

  it('recentAnalyses também muta analysisHistory in-place', () => {
    const original = [
      { id: 'a', createdAt: '2023-01-01' },
      { id: 'b', createdAt: '2026-01-01' }
    ]
    store.analysisHistory = original

    expect(store.recentAnalyses[0].id).toBe('b')
    expect(store.analysisHistory[0].id).toBe('b')
    expect(original[0].id).toBe('b')
  })

  it('fetchRecommendations success com data:null faz recentRecommendations lançar', async () => {
    analysisAPI.getRecommendations.mockResolvedValue(ok(null))

    const result = await store.fetchRecommendations()

    expect(result.success).toBe(true)
    expect(store.recommendations).toBeNull()
    expect(() => store.recentRecommendations).toThrow()
  })

  it('fetchAlerts success com data:null faz activeAlerts lançar', async () => {
    analysisAPI.getAlerts.mockResolvedValue(ok(null))

    const result = await store.fetchAlerts()

    expect(result.success).toBe(true)
    expect(store.alerts).toBeNull()
    expect(() => store.activeAlerts).toThrow()
    expect(() => store.criticalAlerts).toThrow()
  })

  it('runAnalysis success com data:null apaga currentAnalysis e devolve falha', async () => {
    store.currentAnalysis = { id: 'keep-me', score: 91, recommendation: 'buy' }
    analysisAPI.runAnalysis.mockResolvedValue(ok(null))

    const result = await store.runAnalysis('value', { pe: 8 })

    expect(result.success).toBe(false)
    expect(store.currentAnalysis).toBeNull()
    expect(store.analysisHistory).toEqual([])
  })
})
