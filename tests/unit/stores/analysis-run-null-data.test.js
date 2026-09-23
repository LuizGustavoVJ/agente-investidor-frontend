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

import { analysisAPI } from '@/api/analysis'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis — runAnalysis com data:null apaga a análise atual', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('success:true e data:null zera currentAnalysis, não entra no histórico e devolve falha', async () => {
    const store = useAnalysisStore()
    store.currentAnalysis = { id: 99, name: 'análise anterior' }
    store.analysisHistory = []

    analysisAPI.runAnalysis.mockResolvedValue({
      data: { success: true, data: null }
    })

    const result = await store.runAnalysis(3, { period: '1Y' })

    expect(result.success).toBe(false)
    expect(store.currentAnalysis).toBeNull()
    expect(store.analysisHistory).toHaveLength(0)
    expect(store.error).toBeTruthy()
  })
})
