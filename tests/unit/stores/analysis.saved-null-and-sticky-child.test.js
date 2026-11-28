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

describe('Analysis: savedAnalyses null e error sticky nos fetches filhos', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchSavedAnalyses com data:null zera a lista; saveAnalysis seguinte falha no push', async () => {
    const store = useAnalysisStore()
    store.savedAnalyses = [{ id: 'keep' }]
    analysisAPI.getSavedAnalyses.mockResolvedValue(ok(null))

    expect((await store.fetchSavedAnalyses()).success).toBe(true)
    expect(store.savedAnalyses).toBeNull()

    analysisAPI.saveAnalysis.mockResolvedValue(ok({ id: 'new', title: 'PETR4' }))
    const result = await store.saveAnalysis({ title: 'PETR4' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/null|undefined|push/i)
    expect(analysisAPI.saveAnalysis).toHaveBeenCalled()
    expect(store.savedAnalyses).toBeNull()
  })

  it('fetchMarketAnalysis com data:null apaga o snapshot anterior', async () => {
    const store = useAnalysisStore()
    store.marketAnalysis = { ibov: 130000, ibovChange: 0.8 }
    analysisAPI.getMarketAnalysis.mockResolvedValue(ok(null))

    const result = await store.fetchMarketAnalysis()

    expect(result.success).toBe(true)
    expect(store.marketAnalysis).toBeNull()
  })

  it('fetchAnalysisHistory/market/saved com sucesso não limpam error sticky', async () => {
    const store = useAnalysisStore()
    store.error = 'alertas falharam'

    analysisAPI.getAnalysisHistory.mockResolvedValue(ok([{ id: 'h1' }]))
    analysisAPI.getMarketAnalysis.mockResolvedValue(ok({ ibov: 1 }))
    analysisAPI.getSavedAnalyses.mockResolvedValue(ok([{ id: 's1' }]))

    expect((await store.fetchAnalysisHistory()).success).toBe(true)
    expect((await store.fetchMarketAnalysis()).success).toBe(true)
    expect((await store.fetchSavedAnalyses()).success).toBe(true)

    expect(store.analysisHistory).toHaveLength(1)
    expect(store.marketAnalysis).toEqual({ ibov: 1 })
    expect(store.savedAnalyses).toHaveLength(1)
    expect(store.error).toBe('alertas falharam')
  })

  it('fetchAssetAnalysis, compareAssets e runPortfolioOptimization não gravam currentAnalysis', async () => {
    const store = useAnalysisStore()
    store.currentAnalysis = { id: 'old', score: 70 }

    analysisAPI.getAssetAnalysis.mockResolvedValue(ok({ symbol: 'PETR4', score: 91 }))
    analysisAPI.compareAssets.mockResolvedValue(ok({ winner: 'VALE3' }))
    analysisAPI.getPortfolioOptimization.mockResolvedValue(ok({ weights: { PETR4: 1 } }))

    expect((await store.fetchAssetAnalysis('PETR4')).success).toBe(true)
    expect((await store.compareAssets(['PETR4', 'VALE3'])).success).toBe(true)
    expect((await store.runPortfolioOptimization({ risk: 'low' })).success).toBe(true)

    expect(store.currentAnalysis).toEqual({ id: 'old', score: 70 })
  })
})
