import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const analysisAPI = vi.hoisted(() => ({
  getMethodologies: vi.fn(),
  getRecommendations: vi.fn(),
  getAlerts: vi.fn(),
  getAnalysisHistory: vi.fn(),
  getMarketAnalysis: vi.fn(),
  getSavedAnalyses: vi.fn()
}))

vi.mock('@/api/analysis', () => ({ analysisAPI }))

import { useAnalysisStore } from '@/stores/analysis'

const fail = (message) =>
  Promise.resolve({ data: { success: false, message } })

describe('analysis loadAllData — sucesso mesmo com falha total', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()

    analysisAPI.getMethodologies.mockImplementation(() => fail('metodologias'))
    analysisAPI.getRecommendations.mockImplementation(() => fail('recomendações'))
    analysisAPI.getAlerts.mockImplementation(() => fail('alertas'))
    analysisAPI.getAnalysisHistory.mockImplementation(() => fail('histórico'))
    analysisAPI.getMarketAnalysis.mockImplementation(() => fail('mercado'))
    analysisAPI.getSavedAnalyses.mockImplementation(() => fail('salvas'))
  })

  it('devolve { success: true } quando todas as buscas falham sem throw', async () => {
    const result = await store.loadAllData()

    expect(result).toEqual({ success: true })
    expect(store.methodologies).toEqual([])
    expect(store.recommendations).toEqual([])
    expect(store.alerts).toEqual([])
    expect(store.analysisHistory).toEqual([])
    expect(store.marketAnalysis).toBeNull()
    expect(store.savedAnalyses).toEqual([])
  })

  it('fetchAlerts com objeto no lugar de array faz criticalAlerts lançar', async () => {
    analysisAPI.getAlerts.mockResolvedValue({
      data: {
        success: true,
        data: { items: [{ id: 1, priority: 'critical', isRead: false, status: 'active' }] }
      }
    })

    const result = await store.fetchAlerts()
    expect(result.success).toBe(true)
    expect(() => store.activeAlerts).toThrow()
    expect(() => store.criticalAlerts).toThrow()
  })
})
