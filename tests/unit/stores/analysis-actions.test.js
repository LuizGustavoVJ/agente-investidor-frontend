import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'
import { analysisAPI } from '@/api/analysis'

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

const apiSuccess = (data) => ({ data: { success: true, data } })

describe('Analysis Store — getters e ações de risco', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  describe('Getters de alertas e recomendações', () => {
    it('activeAlerts ignora lidos e inativos', () => {
      store.alerts = [
        { id: 1, isRead: false, status: 'active', priority: 'high' },
        { id: 2, isRead: true, status: 'active', priority: 'critical' },
        { id: 3, isRead: false, status: 'resolved', priority: 'critical' },
        { id: 4, isRead: false, status: 'active', priority: 'critical' }
      ]

      expect(store.activeAlerts.map(a => a.id)).toEqual([1, 4])
      expect(store.criticalAlerts.map(a => a.id)).toEqual([4])
    })

    it('recentRecommendations ordena por data, limita a 5 e muta o array canônico', () => {
      store.recommendations = [
        { id: 1, createdAt: '2026-01-01' },
        { id: 2, createdAt: '2026-03-01' },
        { id: 3, createdAt: '2026-02-01' },
        { id: 4, createdAt: '2026-06-01' },
        { id: 5, createdAt: '2026-04-01' },
        { id: 6, createdAt: '2026-05-01' }
      ]

      expect(store.recentRecommendations.map(r => r.id)).toEqual([4, 6, 5, 2, 3])
      expect(store.recommendations[0].id).toBe(4)
    })

    it('markAlertAsRead com id string não marca alerta numérico', async () => {
      store.alerts = [{ id: 1, isRead: false, status: 'active', priority: 'critical' }]
      analysisAPI.markAlertAsRead.mockResolvedValue(apiSuccess({}))

      const result = await store.markAlertAsRead('1')

      expect(result.success).toBe(true)
      expect(store.alerts[0].isRead).toBe(false)
      expect(store.criticalAlerts).toHaveLength(1)
    })

    it('agrupa metodologias e usa Outros quando a categoria falta', () => {
      store.methodologies = [
        { id: 1, name: 'Buffett', category: 'value' },
        { id: 2, name: 'Lynch', category: 'growth' },
        { id: 3, name: 'Custom' }
      ]

      expect(store.methodologiesByCategory.value).toHaveLength(1)
      expect(store.methodologiesByCategory.growth).toHaveLength(1)
      expect(store.methodologiesByCategory.Outros[0].name).toBe('Custom')
    })
  })

  describe('Ações', () => {
    it('runAnalysis grava análise atual e histórico', async () => {
      analysisAPI.runAnalysis.mockResolvedValue(apiSuccess({ id: 'a1', score: 82 }))

      const result = await store.runAnalysis('buffett', { pe: 12 })

      expect(result.success).toBe(true)
      expect(store.currentAnalysis).toEqual({ id: 'a1', score: 82 })
      expect(store.analysisHistory[0]).toMatchObject({
        id: 'a1',
        methodologyId: 'buffett',
        parameters: { pe: 12 },
        status: 'completed'
      })
    })

    it('markAlertAsRead atualiza somente o alerta correspondente', async () => {
      store.alerts = [
        { id: 'al-1', isRead: false },
        { id: 'al-2', isRead: false }
      ]
      analysisAPI.markAlertAsRead.mockResolvedValue(apiSuccess({}))

      const result = await store.markAlertAsRead('al-1')

      expect(result.success).toBe(true)
      expect(store.alerts[0].isRead).toBe(true)
      expect(store.alerts[0].readAt).toBeInstanceOf(Date)
      expect(store.alerts[1].isRead).toBe(false)
    })

    it('deleteSavedAnalysis remove item da lista local', async () => {
      store.savedAnalyses = [{ id: 's1' }, { id: 's2' }]
      analysisAPI.deleteSavedAnalysis.mockResolvedValue(apiSuccess({}))

      const result = await store.deleteSavedAnalysis('s1')

      expect(result.success).toBe(true)
      expect(store.savedAnalyses).toEqual([{ id: 's2' }])
    })

    it('propaga erro da API em fetchMethodologies', async () => {
      analysisAPI.getMethodologies.mockRejectedValue({
        response: { data: { message: 'Serviço indisponível' } }
      })

      const result = await store.fetchMethodologies()

      expect(result).toEqual({ success: false, error: 'Serviço indisponível' })
      expect(store.methodologies).toEqual([])
    })
  })
})
