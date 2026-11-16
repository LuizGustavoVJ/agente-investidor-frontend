import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { analysisAPI } = vi.hoisted(() => ({
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

vi.mock('@/api/analysis', () => ({ analysisAPI }))

import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis store — getters e ações', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  describe('alertas', () => {
    it('activeAlerts exige isRead falso e status active; criticalAlerts usa só esses', () => {
      store.alerts = [
        { id: 1, isRead: false, status: 'active', priority: 'critical' },
        { id: 2, isRead: false, status: 'active', priority: 'high' },
        { id: 3, isRead: true, status: 'active', priority: 'critical' },
        { id: 4, isRead: false, status: 'resolved', priority: 'critical' }
      ]

      expect(store.activeAlerts.map((a) => a.id)).toEqual([1, 2])
      expect(store.criticalAlerts.map((a) => a.id)).toEqual([1])
    })

    it('markAlertAsRead usa igualdade estrita de id e não marca o par numérico/string', async () => {
      store.alerts = [
        { id: 1, isRead: false, status: 'active' },
        { id: '1', isRead: false, status: 'active' }
      ]
      analysisAPI.markAlertAsRead.mockResolvedValue({ data: { success: true } })

      await store.markAlertAsRead(1)

      expect(store.alerts[0].isRead).toBe(true)
      expect(store.alerts[0].readAt).toBeInstanceOf(Date)
      expect(store.alerts[1].isRead).toBe(false)
    })
  })

  describe('metodologias e recomendações', () => {
    it('agrupa categoria ausente em Outros', () => {
      store.methodologies = [
        { id: 1, name: 'Graham', category: 'value' },
        { id: 2, name: 'Custom' }
      ]

      expect(store.methodologiesByCategory).toEqual({
        value: [{ id: 1, name: 'Graham', category: 'value' }],
        Outros: [{ id: 2, name: 'Custom' }]
      })
    })

    it('recentRecommendations ordena in-place e corta em 5', () => {
      store.recommendations = [
        { id: 'old', createdAt: '2024-01-01' },
        { id: 'new', createdAt: '2026-01-01' },
        { id: 'mid', createdAt: '2025-06-01' }
      ]

      expect(store.recentRecommendations.map((r) => r.id)).toEqual(['new', 'mid', 'old'])
      expect(store.recommendations[0].id).toBe('new')
    })
  })

  describe('runAnalysis e persistência', () => {
    it('empilha o resultado no histórico na frente da lista', async () => {
      store.analysisHistory = [{ id: 'prev' }]
      analysisAPI.runAnalysis.mockResolvedValue({
        data: { success: true, data: { id: 'run-9', score: 80 } }
      })

      const result = await store.runAnalysis('graham', { minPe: 8 })

      expect(result.success).toBe(true)
      expect(store.currentAnalysis).toEqual({ id: 'run-9', score: 80 })
      expect(store.analysisHistory[0]).toMatchObject({
        id: 'run-9',
        methodologyId: 'graham',
        parameters: { minPe: 8 },
        status: 'completed'
      })
      expect(store.analysisHistory).toHaveLength(2)
    })

    it('deleteSavedAnalysis filtra por igualdade estrita', async () => {
      store.savedAnalyses = [{ id: 3 }, { id: '3' }]
      analysisAPI.deleteSavedAnalysis.mockResolvedValue({ data: { success: true } })

      await store.deleteSavedAnalysis(3)

      expect(store.savedAnalyses).toEqual([{ id: '3' }])
    })
  })

  describe('clearData', () => {
    it('zera coleções mas preserva error', () => {
      store.methodologies = [{ id: 1 }]
      store.currentAnalysis = { id: 1 }
      store.error = 'falha'
      store.lastUpdate = new Date()

      store.clearData()

      expect(store.methodologies).toEqual([])
      expect(store.currentAnalysis).toBeNull()
      expect(store.lastUpdate).toBeNull()
      expect(store.error).toBe('falha')
    })
  })
})
