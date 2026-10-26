import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'
import { analysisAPI } from '@/api/analysis'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getMarketAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn(),
    shareAnalysis: vi.fn(),
    getSharedAnalysis: vi.fn(),
    configureAlerts: vi.fn(),
    getAlertConfigurations: vi.fn(),
    updateAlertConfiguration: vi.fn(),
    deleteAlertConfiguration: vi.fn(),
    getBacktesting: vi.fn()
  }
}))

describe('Analysis — share, config de alerta e backtest existem na API e somem na store', () => {
  let analysisStore

  beforeEach(() => {
    setActivePinia(createPinia())
    analysisStore = useAnalysisStore()
    vi.clearAllMocks()
    analysisStore.savedAnalyses = [
      { id: 3, name: 'RSI PETR4', createdAt: '2026-10-01' }
    ]
    analysisStore.alerts = [
      { id: 1, message: 'Caixa baixo', priority: 'critical', status: 'active', isRead: false }
    ]
  })

  it('store não expõe shareAnalysis — a API existe e a análise salva permanece só local', () => {
    expect(typeof analysisAPI.shareAnalysis).toBe('function')
    expect(typeof analysisAPI.getSharedAnalysis).toBe('function')

    expect(analysisStore.shareAnalysis).toBeUndefined()
    expect(analysisStore.getSharedAnalysis).toBeUndefined()
    expect(analysisStore.savedAnalyses).toEqual([
      { id: 3, name: 'RSI PETR4', createdAt: '2026-10-01' }
    ])
  })

  it('store não expõe configureAlerts nem getBacktesting — alertas críticos e histórico ficam iguais', () => {
    expect(typeof analysisAPI.configureAlerts).toBe('function')
    expect(typeof analysisAPI.getAlertConfigurations).toBe('function')
    expect(typeof analysisAPI.getBacktesting).toBe('function')

    expect(analysisStore.configureAlerts).toBeUndefined()
    expect(analysisStore.getAlertConfigurations).toBeUndefined()
    expect(analysisStore.getBacktesting).toBeUndefined()
    expect(analysisStore.criticalAlerts).toHaveLength(1)
    expect(analysisStore.criticalAlerts[0].message).toBe('Caixa baixo')
    expect(analysisStore.analysisHistory).toEqual([])
    expect(analysisStore.currentAnalysis).toBeNull()
  })
})
