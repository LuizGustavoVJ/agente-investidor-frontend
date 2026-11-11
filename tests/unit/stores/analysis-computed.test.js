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

describe('Analysis store — alertas e histórico', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  describe('alertas', () => {
    it('activeAlerts exige não lido e status active', () => {
      store.alerts = [
        { id: 1, isRead: false, status: 'active', priority: 'high' },
        { id: 2, isRead: true, status: 'active', priority: 'critical' },
        { id: 3, isRead: false, status: 'resolved', priority: 'critical' },
        { id: 4, isRead: false, status: 'active', priority: 'critical' }
      ]

      expect(store.activeAlerts.map(a => a.id)).toEqual([1, 4])
      expect(store.criticalAlerts.map(a => a.id)).toEqual([4])
    })

    it('marca alerta como lido e registra readAt', async () => {
      store.alerts = [
        { id: 'a1', isRead: false, status: 'active' },
        { id: 'a2', isRead: false, status: 'active' }
      ]
      analysisAPI.markAlertAsRead.mockResolvedValue({ data: { success: true } })

      const result = await store.markAlertAsRead('a1')

      expect(result.success).toBe(true)
      expect(store.alerts[0].isRead).toBe(true)
      expect(store.alerts[0].readAt).toBeInstanceOf(Date)
      expect(store.alerts[1].isRead).toBe(false)
      expect(store.activeAlerts.map(a => a.id)).toEqual(['a2'])
    })

    it('não falha se o alerta marcado não existe mais no estado', async () => {
      store.alerts = []
      analysisAPI.markAlertAsRead.mockResolvedValue({ data: { success: true } })

      const result = await store.markAlertAsRead('missing')

      expect(result.success).toBe(true)
    })
  })

  describe('metodologias e recomendações', () => {
    it('agrupa metodologias por categoria e usa Outros como fallback', () => {
      store.methodologies = [
        { id: 1, name: 'Buffett', category: 'value' },
        { id: 2, name: 'Lynch', category: 'growth' },
        { id: 3, name: 'Custom' },
        { id: 4, name: 'Graham', category: 'value' }
      ]

      const grouped = store.methodologiesByCategory

      expect(grouped.value.map(m => m.id)).toEqual([1, 4])
      expect(grouped.growth.map(m => m.id)).toEqual([2])
      expect(grouped.Outros.map(m => m.id)).toEqual([3])
    })

    it('recentRecommendations devolve no máximo 5, da mais recente', () => {
      store.recommendations = [
        { id: 1, createdAt: '2024-01-01' },
        { id: 2, createdAt: '2026-05-01' },
        { id: 3, createdAt: '2025-01-01' },
        { id: 4, createdAt: '2026-06-01' },
        { id: 5, createdAt: '2023-01-01' },
        { id: 6, createdAt: '2026-07-01' }
      ]

      expect(store.recentRecommendations.map(r => r.id)).toEqual([6, 4, 2, 3, 1])
    })
  })

  describe('runAnalysis', () => {
    it('grava currentAnalysis e prepend no histórico', async () => {
      analysisAPI.runAnalysis.mockResolvedValue({
        data: { success: true, data: { id: 'an-9', score: 81 } }
      })

      store.analysisHistory = [{ id: 'old' }]

      const result = await store.runAnalysis('buffett', { pe: 12 })

      expect(result.success).toBe(true)
      expect(store.currentAnalysis).toEqual({ id: 'an-9', score: 81 })
      expect(store.analysisHistory[0]).toMatchObject({
        id: 'an-9',
        methodologyId: 'buffett',
        parameters: { pe: 12 },
        status: 'completed'
      })
      expect(store.analysisHistory).toHaveLength(2)
    })
  })

  describe('saved analyses', () => {
    it('remove análise salva pelo id', async () => {
      store.savedAnalyses = [{ id: 's1' }, { id: 's2' }]
      analysisAPI.deleteSavedAnalysis.mockResolvedValue({ data: { success: true } })

      const result = await store.deleteSavedAnalysis('s1')

      expect(result.success).toBe(true)
      expect(store.savedAnalyses).toEqual([{ id: 's2' }])
    })
  })
})
