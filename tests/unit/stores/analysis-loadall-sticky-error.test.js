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

const fail = (message) => ({ data: { success: false, message } })
const ok = (data) => ({ data: { success: true, data } })

describe('Analysis: loadAllData mente sucesso e fetch não limpa error', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('loadAllData devolve success:true com todas as filhas em { success: false }', async () => {
    analysisAPI.getMethodologies.mockResolvedValue(fail('metodologias'))
    analysisAPI.getRecommendations.mockResolvedValue(fail('recomendações'))
    analysisAPI.getAlerts.mockResolvedValue(fail('alertas'))
    analysisAPI.getAnalysisHistory.mockResolvedValue(fail('histórico'))
    analysisAPI.getMarketAnalysis.mockResolvedValue(fail('mercado'))
    analysisAPI.getSavedAnalyses.mockResolvedValue(fail('salvas'))

    const result = await store.loadAllData()

    expect(result.success).toBe(true)
    expect(store.methodologies).toEqual([])
    expect(store.recommendations).toEqual([])
    expect(store.alerts).toEqual([])
    expect(store.savedAnalyses).toEqual([])
    expect(store.currentAnalysis).toBeNull()
  })

  it('fetchAlerts com sucesso não limpa error deixado por uma falha anterior', async () => {
    analysisAPI.getAlerts
      .mockResolvedValueOnce(fail('Erro ao carregar alertas'))
      .mockResolvedValueOnce(ok([{ id: 1, isRead: false, status: 'active', priority: 'critical' }]))

    await store.fetchAlerts()
    expect(store.error).toBe('Erro ao carregar alertas')
    expect(store.activeAlerts).toEqual([])

    const result = await store.fetchAlerts()
    expect(result.success).toBe(true)
    expect(store.alerts).toHaveLength(1)
    expect(store.activeAlerts).toHaveLength(1)
    expect(store.error).toBe('Erro ao carregar alertas')
  })

  it('fetchRecommendations com sucesso também deixa error sticky — Dashboard ORs analysisStore.error', async () => {
    analysisAPI.getRecommendations
      .mockResolvedValueOnce(fail('Erro ao carregar recomendações'))
      .mockResolvedValueOnce(ok([{ id: 9, createdAt: '2026-11-23' }]))

    await store.fetchRecommendations()
    const result = await store.fetchRecommendations()

    expect(result.success).toBe(true)
    expect(store.recommendations).toHaveLength(1)
    expect(store.error).toBe('Erro ao carregar recomendações')
  })
})
