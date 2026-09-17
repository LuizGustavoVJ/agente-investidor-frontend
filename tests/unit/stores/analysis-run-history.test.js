import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    runAnalysis: vi.fn(),
    markAlertAsRead: vi.fn(),
    getMethodologies: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getMarketAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn()
  }
}))

import { analysisAPI } from '@/api/analysis'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis Store — runAnalysis com payload vazio e alertas sem status', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('sucesso com data null apaga a análise atual e devolve falha', async () => {
    store.currentAnalysis = { id: 'analise-anterior', score: 80 }
    store.analysisHistory = [{ id: 'hist-1' }]
    analysisAPI.runAnalysis.mockResolvedValue({
      data: { success: true, data: null }
    })

    const result = await store.runAnalysis('value-investing', { ticker: 'PETR4' })

    expect(result.success).toBe(false)
    expect(store.currentAnalysis).toBeNull()
    expect(store.analysisHistory).toEqual([{ id: 'hist-1' }])
  })

  it('sucesso sem id ainda grava histórico com id undefined', async () => {
    analysisAPI.runAnalysis.mockResolvedValue({
      data: { success: true, data: { score: 61 } }
    })

    const result = await store.runAnalysis('momentum')

    expect(result.success).toBe(true)
    expect(store.currentAnalysis).toEqual({ score: 61 })
    expect(store.analysisHistory[0].id).toBeUndefined()
    expect(store.analysisHistory[0].methodologyId).toBe('momentum')
    expect(store.analysisHistory[0].status).toBe('completed')
  })

  it('activeAlerts ignora item sem status active mesmo não lido', () => {
    store.alerts = [
      { id: 1, isRead: false, status: 'active', priority: 'high' },
      { id: 2, isRead: false, priority: 'critical' },
      { id: 3, isRead: true, status: 'active', priority: 'critical' },
      { id: 4, isRead: false, status: 'resolved', priority: 'critical' }
    ]

    expect(store.activeAlerts.map((alert) => alert.id)).toEqual([1])
    expect(store.criticalAlerts).toEqual([])
  })

  it('methodologiesByCategory agrupa sem categoria em Outros', () => {
    store.methodologies = [
      { id: 1, name: 'Value', category: 'value' },
      { id: 2, name: 'Sem categoria' },
      { id: 3, name: 'Outra value', category: 'value' }
    ]

    expect(store.methodologiesByCategory.value).toHaveLength(2)
    expect(store.methodologiesByCategory.Outros).toEqual([
      { id: 2, name: 'Sem categoria' }
    ])
  })
})
