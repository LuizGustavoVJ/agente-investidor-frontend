import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn(),
    runAnalysis: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    markAlertAsRead: vi.fn(),
    getAnalysisHistory: vi.fn()
  }
}))

import { analysisAPI } from '@/api/analysis'
import { useAnalysisStore } from '@/stores/analysis'

const success = (data) => ({ data: { success: true, data } })

describe('Analysis Store — alertas, recomendações e execução', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  describe('Getters de alerta', () => {
    it('activeAlerts ignora lidos e inativos', () => {
      store.alerts = [
        { id: 1, isRead: false, status: 'active', priority: 'high' },
        { id: 2, isRead: true, status: 'active', priority: 'critical' },
        { id: 3, isRead: false, status: 'resolved', priority: 'critical' },
        { id: 4, isRead: false, status: 'active', priority: 'critical' }
      ]

      expect(store.activeAlerts.map((a) => a.id)).toEqual([1, 4])
      expect(store.criticalAlerts.map((a) => a.id)).toEqual([4])
    })
  })

  describe('Getters de recomendações e histórico', () => {
    it('recentRecommendations devolve as 5 mais recentes', () => {
      store.recommendations = [
        { id: 1, createdAt: '2026-01-01' },
        { id: 2, createdAt: '2026-06-01' },
        { id: 3, createdAt: '2026-03-01' },
        { id: 4, createdAt: '2026-08-01' },
        { id: 5, createdAt: '2026-02-01' },
        { id: 6, createdAt: '2026-09-01' }
      ]

      expect(store.recentRecommendations.map((r) => r.id)).toEqual([6, 4, 2, 3, 5])
    })

    it('recentAnalyses limita o histórico a 10 itens ordenados', () => {
      store.analysisHistory = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        createdAt: `2026-01-${String(i + 1).padStart(2, '0')}`
      }))

      expect(store.recentAnalyses).toHaveLength(10)
      expect(store.recentAnalyses[0].id).toBe(11)
    })

    it('agrupa metodologias por categoria e usa Outros como fallback', () => {
      store.methodologies = [
        { id: 1, name: 'Graham', category: 'value' },
        { id: 2, name: 'Lynch' },
        { id: 3, name: 'Buffett', category: 'value' }
      ]

      expect(store.methodologiesByCategory).toEqual({
        value: [
          { id: 1, name: 'Graham', category: 'value' },
          { id: 3, name: 'Buffett', category: 'value' }
        ],
        Outros: [{ id: 2, name: 'Lynch' }]
      })
    })
  })

  describe('Ações', () => {
    it('runAnalysis grava resultado atual e prepend no histórico', async () => {
      analysisAPI.runAnalysis.mockResolvedValue(success({ id: 'an-1', score: 82 }))

      const result = await store.runAnalysis('graham', { minMargin: 0.4 })

      expect(result.success).toBe(true)
      expect(store.currentAnalysis).toEqual({ id: 'an-1', score: 82 })
      expect(store.analysisHistory[0]).toMatchObject({
        id: 'an-1',
        methodologyId: 'graham',
        parameters: { minMargin: 0.4 },
        status: 'completed'
      })
    })

    it('markAlertAsRead atualiza somente o alerta correspondente', async () => {
      store.alerts = [
        { id: 'a1', isRead: false, status: 'active' },
        { id: 'a2', isRead: false, status: 'active' }
      ]
      analysisAPI.markAlertAsRead.mockResolvedValue(success(null))

      await store.markAlertAsRead('a1')

      expect(store.alerts[0].isRead).toBe(true)
      expect(store.alerts[0].readAt).toBeInstanceOf(Date)
      expect(store.alerts[1].isRead).toBe(false)
      expect(store.activeAlerts.map((a) => a.id)).toEqual(['a2'])
    })

    it('fetchMethodologies preenche lista e lastUpdate', async () => {
      analysisAPI.getMethodologies.mockResolvedValue(
        success([{ id: 1, name: 'Graham' }])
      )

      const result = await store.fetchMethodologies()

      expect(result.success).toBe(true)
      expect(store.methodologies).toHaveLength(1)
      expect(store.lastUpdate).toBeInstanceOf(Date)
    })

    it('retorna erro amigável quando runAnalysis falha', async () => {
      const error = new Error('fail')
      error.response = { data: { message: 'Metodologia indisponível' } }
      analysisAPI.runAnalysis.mockRejectedValue(error)

      const result = await store.runAnalysis('unknown')

      expect(result).toEqual({ success: false, error: 'Metodologia indisponível' })
      expect(store.currentAnalysis).toBeNull()
      expect(store.analysisHistory).toEqual([])
    })
  })
})
