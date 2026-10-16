import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'
import { analysisAPI } from '@/api/analysis'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    compareAssets: vi.fn(),
    getPortfolioOptimization: vi.fn(),
    getAssetAnalysis: vi.fn(),
    getMethodologies: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getMarketAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn(),
    runAnalysis: vi.fn()
  }
}))

describe('Analysis store — compareAssets e runPortfolioOptimization não persistem resultado', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('compareAssets sucesso devolve data e não grava currentAnalysis nem histórico', async () => {
    const payload = {
      symbols: ['PETR4', 'VALE3'],
      winner: 'VALE3',
      scores: { PETR4: 71, VALE3: 84 }
    }
    analysisAPI.compareAssets.mockResolvedValue({
      data: { success: true, data: payload }
    })

    store.currentAnalysis = { symbol: 'ITUB4', score: 40 }
    store.analysisHistory = [{ id: 'old', symbol: 'ITUB4' }]
    store.savedAnalyses = [{ id: 'saved-1' }]

    const result = await store.compareAssets(['PETR4', 'VALE3'])

    expect(result).toEqual({ success: true, data: payload })
    expect(analysisAPI.compareAssets).toHaveBeenCalledWith(['PETR4', 'VALE3'])
    expect(store.currentAnalysis).toEqual({ symbol: 'ITUB4', score: 40 })
    expect(store.analysisHistory).toEqual([{ id: 'old', symbol: 'ITUB4' }])
    expect(store.savedAnalyses).toEqual([{ id: 'saved-1' }])
    expect(store).not.toHaveProperty('comparison')
    expect(store).not.toHaveProperty('assetComparison')
    expect(store.error).toBeNull()
    expect(store.isLoading).toBe(false)
  })

  it('compareAssets com success:false não persiste comparação e preenche error', async () => {
    analysisAPI.compareAssets.mockResolvedValue({
      data: { success: false, message: 'Símbolos inválidos' }
    })

    const result = await store.compareAssets(['XXXX'])

    expect(result.success).toBe(false)
    expect(result.error).toBe('Símbolos inválidos')
    expect(store.currentAnalysis).toBeNull()
    expect(store.analysisHistory).toEqual([])
    expect(store.isLoading).toBe(false)
  })

  it('runPortfolioOptimization sucesso devolve alocação e não persiste em nenhum estado da store', async () => {
    const payload = {
      expectedReturn: 0.14,
      allocations: [
        { symbol: 'PETR4', weight: 0.4 },
        { symbol: 'VALE3', weight: 0.6 }
      ]
    }
    analysisAPI.getPortfolioOptimization.mockResolvedValue({
      data: { success: true, data: payload }
    })

    store.currentAnalysis = { symbol: 'BBDC4' }
    store.analysisHistory = [{ id: 'hist-1' }]

    const result = await store.runPortfolioOptimization({ risk: 'moderate' })

    expect(result).toEqual({ success: true, data: payload })
    expect(analysisAPI.getPortfolioOptimization).toHaveBeenCalledWith({ risk: 'moderate' })
    expect(store.currentAnalysis).toEqual({ symbol: 'BBDC4' })
    expect(store.analysisHistory).toEqual([{ id: 'hist-1' }])
    expect(store.savedAnalyses).toEqual([])
    expect(store).not.toHaveProperty('optimization')
    expect(store).not.toHaveProperty('optimizedPortfolio')
    expect(store.error).toBeNull()
    expect(store.isLoading).toBe(false)
  })

  it('runPortfolioOptimization com falha da API não grava alocação e reseta isLoading', async () => {
    analysisAPI.getPortfolioOptimization.mockResolvedValue({
      data: { success: false, message: 'Carteira vazia' }
    })

    const result = await store.runPortfolioOptimization({})

    expect(result.success).toBe(false)
    expect(result.error).toBe('Carteira vazia')
    expect(store.currentAnalysis).toBeNull()
    expect(store.analysisHistory).toEqual([])
    expect(store.isLoading).toBe(false)
  })
})
