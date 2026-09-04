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

const success = (data) => ({ data: { success: true, data } })
const apiError = (message) => {
  const error = new Error(message)
  error.response = { data: { message } }
  return error
}

describe('Analysis Store — persistência, comparação e otimização', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  describe('Leituras', () => {
    it('preenche recomendações, alertas, histórico e mercado', async () => {
      analysisAPI.getRecommendations.mockResolvedValue(success([{ id: 'r1' }]))
      analysisAPI.getAlerts.mockResolvedValue(success([{ id: 'a1', isRead: false, status: 'active' }]))
      analysisAPI.getAnalysisHistory.mockResolvedValue(success([{ id: 'h1' }]))
      analysisAPI.getMarketAnalysis.mockResolvedValue(success({ ibov: 'alta' }))

      await store.fetchRecommendations({ priority: 'high' })
      await store.fetchAlerts({ status: 'active' })
      await store.fetchAnalysisHistory({ limit: 10 })
      await store.fetchMarketAnalysis()

      expect(analysisAPI.getRecommendations).toHaveBeenCalledWith({ priority: 'high' })
      expect(store.recommendations).toEqual([{ id: 'r1' }])
      expect(store.alerts).toEqual([{ id: 'a1', isRead: false, status: 'active' }])
      expect(store.analysisHistory).toEqual([{ id: 'h1' }])
      expect(store.marketAnalysis).toEqual({ ibov: 'alta' })
    })

    it('devolve análise de ativo sem gravar currentAnalysis', async () => {
      analysisAPI.getAssetAnalysis.mockResolvedValue(success({ symbol: 'PETR4', score: 78 }))

      const result = await store.fetchAssetAnalysis('PETR4', ['graham'])

      expect(result).toEqual({ success: true, data: { symbol: 'PETR4', score: 78 } })
      expect(store.currentAnalysis).toBeNull()
      expect(analysisAPI.getAssetAnalysis).toHaveBeenCalledWith('PETR4', ['graham'])
    })
  })

  describe('Análises salvas', () => {
    it('adiciona análise salva à lista', async () => {
      const saved = { id: 's1', title: 'Graham PETR4' }
      analysisAPI.saveAnalysis.mockResolvedValue(success(saved))

      const result = await store.saveAnalysis({ title: 'Graham PETR4' })

      expect(result.success).toBe(true)
      expect(store.savedAnalyses).toEqual([saved])
    })

    it('remove somente a análise deletada', async () => {
      store.savedAnalyses = [{ id: 's1' }, { id: 's2' }]
      analysisAPI.deleteSavedAnalysis.mockResolvedValue(success(null))

      const result = await store.deleteSavedAnalysis('s1')

      expect(result.success).toBe(true)
      expect(store.savedAnalyses).toEqual([{ id: 's2' }])
    })

    it('não remove análise se a API recusar o delete', async () => {
      store.savedAnalyses = [{ id: 's1' }]
      analysisAPI.deleteSavedAnalysis.mockResolvedValue({
        data: { success: false, message: 'Análise em uso' }
      })

      const result = await store.deleteSavedAnalysis('s1')

      expect(result.success).toBe(false)
      expect(store.savedAnalyses).toEqual([{ id: 's1' }])
    })
  })

  describe('Comparação e otimização', () => {
    it('compara ativos e devolve o payload sem persistir estado extra', async () => {
      analysisAPI.compareAssets.mockResolvedValue(success({ winner: 'VALE3' }))

      const result = await store.compareAssets(['PETR4', 'VALE3'])

      expect(analysisAPI.compareAssets).toHaveBeenCalledWith(['PETR4', 'VALE3'])
      expect(result).toEqual({ success: true, data: { winner: 'VALE3' } })
      expect(store.isLoading).toBe(false)
    })

    it('propaga erro de otimização de carteira', async () => {
      analysisAPI.getPortfolioOptimization.mockRejectedValue(apiError('Parâmetros inválidos'))

      const result = await store.runPortfolioOptimization({ risk: -1 })

      expect(result).toEqual({ success: false, error: 'Parâmetros inválidos' })
      expect(store.error).toBe('Parâmetros inválidos')
    })

    it('retorna dados de otimização em caso de sucesso', async () => {
      analysisAPI.getPortfolioOptimization.mockResolvedValue(
        success({ weights: { PETR4: 0.4, VALE3: 0.6 } })
      )

      const result = await store.runPortfolioOptimization({ risk: 0.2 })

      expect(result.success).toBe(true)
      expect(result.data.weights.VALE3).toBe(0.6)
    })
  })

  describe('loadAllData e clearData', () => {
    it('carrega metodologias, recomendações, alertas, histórico, mercado e salvas', async () => {
      analysisAPI.getMethodologies.mockResolvedValue(success([{ id: 1 }]))
      analysisAPI.getRecommendations.mockResolvedValue(success([]))
      analysisAPI.getAlerts.mockResolvedValue(success([]))
      analysisAPI.getAnalysisHistory.mockResolvedValue(success([]))
      analysisAPI.getMarketAnalysis.mockResolvedValue(success({}))
      analysisAPI.getSavedAnalyses.mockResolvedValue(success([{ id: 's1' }]))

      const result = await store.loadAllData()

      expect(result.success).toBe(true)
      expect(store.methodologies).toEqual([{ id: 1 }])
      expect(store.savedAnalyses).toEqual([{ id: 's1' }])
    })

    it('zera coleções em clearData', () => {
      store.methodologies = [{ id: 1 }]
      store.recommendations = [{ id: 1 }]
      store.alerts = [{ id: 1 }]
      store.analysisHistory = [{ id: 1 }]
      store.currentAnalysis = { id: 1 }
      store.marketAnalysis = { ibov: 1 }
      store.savedAnalyses = [{ id: 1 }]
      store.lastUpdate = new Date()
      store.error = 'x'

      store.clearData()
      store.clearError()

      expect(store.methodologies).toEqual([])
      expect(store.alerts).toEqual([])
      expect(store.currentAnalysis).toBeNull()
      expect(store.savedAnalyses).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
