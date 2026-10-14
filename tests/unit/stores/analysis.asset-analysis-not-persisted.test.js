import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'
import { analysisAPI } from '@/api/analysis'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getAssetAnalysis: vi.fn(),
    getMethodologies: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getMarketAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn()
  }
}))

describe('Analysis store — fetchAssetAnalysis não persiste o resultado', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('sucesso devolve data mas currentAnalysis e o histórico ficam vazios', async () => {
    const payload = {
      symbol: 'PETR4',
      score: 82,
      recommendation: 'buy'
    }
    analysisAPI.getAssetAnalysis.mockResolvedValue({
      data: { success: true, data: payload }
    })

    store.currentAnalysis = { symbol: 'VALE3', score: 10 }
    store.analysisHistory = [{ id: 'old', symbol: 'VALE3' }]

    const result = await store.fetchAssetAnalysis('PETR4', ['value', 'growth'])

    expect(result).toEqual({ success: true, data: payload })
    expect(analysisAPI.getAssetAnalysis).toHaveBeenCalledWith('PETR4', ['value', 'growth'])
    expect(store.currentAnalysis).toEqual({ symbol: 'VALE3', score: 10 })
    expect(store.analysisHistory).toEqual([{ id: 'old', symbol: 'VALE3' }])
    expect(store.savedAnalyses).toEqual([])
    expect(store.error).toBeNull()
  })

  it('success:false da API também não grava currentAnalysis', async () => {
    analysisAPI.getAssetAnalysis.mockResolvedValue({
      data: { success: false, message: 'Ativo não encontrado' }
    })

    const result = await store.fetchAssetAnalysis('XXXX')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Ativo não encontrado')
    expect(store.currentAnalysis).toBeNull()
    expect(store.analysisHistory).toEqual([])
  })
})
