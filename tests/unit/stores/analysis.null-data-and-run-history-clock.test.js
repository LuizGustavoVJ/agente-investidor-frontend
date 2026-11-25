import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

describe('Analysis: data null quebra getters e histórico usa relógio local', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-25T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetchMethodologies success com data:null deixa methodologies nulo e methodologiesByCategory lança', async () => {
    analysisAPI.getMethodologies.mockResolvedValue({
      data: { success: true, data: null }
    })

    const result = await store.fetchMethodologies()

    expect(result.success).toBe(true)
    expect(store.methodologies).toBeNull()
    expect(() => store.methodologiesByCategory).toThrow()
  })

  it('runAnalysis grava createdAt local e descarta score/recommendation/createdAt do servidor', async () => {
    analysisAPI.runAnalysis.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 'an-9',
          score: 88,
          recommendation: 'buy',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      }
    })

    const result = await store.runAnalysis('value', { pe: 10 })

    expect(result.success).toBe(true)
    expect(store.analysisHistory[0]).toEqual({
      id: 'an-9',
      methodologyId: 'value',
      parameters: { pe: 10 },
      createdAt: new Date('2026-11-25T10:00:00.000Z'),
      status: 'completed'
    })
    expect(store.analysisHistory[0]).not.toHaveProperty('score')
    expect(store.analysisHistory[0]).not.toHaveProperty('recommendation')
    expect(store.analysisHistory[0].createdAt.toISOString()).not.toBe('2024-01-01T00:00:00.000Z')
  })
})
