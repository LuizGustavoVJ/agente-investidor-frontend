import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getMarketAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn()
  }
}))

import { analysisAPI } from '@/api/analysis'
import { useAnalysisStore } from '@/stores/analysis'

const success = (data) => ({ data: { success: true, data } })

describe('Analysis Store — loadAllData com falha parcial', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('devolve success mesmo quando metodologias e alertas falham', async () => {
    analysisAPI.getMethodologies.mockResolvedValue({
      data: { success: false, message: 'Metodologias indisponíveis' }
    })
    analysisAPI.getRecommendations.mockResolvedValue(success([{ id: 1 }]))
    analysisAPI.getAlerts.mockRejectedValue(new Error('timeout'))
    analysisAPI.getAnalysisHistory.mockResolvedValue(success([]))
    analysisAPI.getMarketAnalysis.mockResolvedValue(success({ trend: 'alta' }))
    analysisAPI.getSavedAnalyses.mockResolvedValue(success([]))

    const result = await store.loadAllData()

    expect(result.success).toBe(true)
    expect(store.methodologies).toEqual([])
    expect(store.recommendations).toEqual([{ id: 1 }])
    expect(store.alerts).toEqual([])
    expect(store.marketAnalysis).toEqual({ trend: 'alta' })
  })

  it('não dispara o catch de loadAllData quando os fetches individuais já tratam o erro', async () => {
    analysisAPI.getMethodologies.mockResolvedValue(success([]))
    analysisAPI.getRecommendations.mockResolvedValue(success([]))
    analysisAPI.getAlerts.mockResolvedValue(success([]))
    analysisAPI.getAnalysisHistory.mockResolvedValue({
      data: { success: false, message: 'Histórico indisponível' }
    })
    analysisAPI.getMarketAnalysis.mockResolvedValue(success(null))
    analysisAPI.getSavedAnalyses.mockResolvedValue(success([]))

    const result = await store.loadAllData()

    expect(result.success).toBe(true)
    expect(store.analysisHistory).toEqual([])
  })
})
