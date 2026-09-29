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

import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis — prioridade de alerta case-sensitive', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('criticalAlerts só aceita priority === "critical"; CRITICAL/Critical somem do dashboard', () => {
    store.alerts = [
      { id: 1, isRead: false, status: 'active', priority: 'CRITICAL' },
      { id: 2, isRead: false, status: 'active', priority: 'Critical' },
      { id: 3, isRead: false, status: 'active', priority: 'critical' },
      { id: 4, isRead: false, status: 'active', priority: 'high' }
    ]

    expect(store.activeAlerts.map((a) => a.id)).toEqual([1, 2, 3, 4])
    expect(store.criticalAlerts.map((a) => a.id)).toEqual([3])
  })

  it('priority "critical" lido (isRead true) também some da lista crítica', () => {
    store.alerts = [
      { id: 1, isRead: true, status: 'active', priority: 'critical' },
      { id: 2, isRead: false, status: 'resolved', priority: 'critical' }
    ]

    expect(store.criticalAlerts).toEqual([])
  })
})
