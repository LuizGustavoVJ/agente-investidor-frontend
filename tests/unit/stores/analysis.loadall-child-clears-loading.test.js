import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
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
    getSavedAnalyses: vi.fn()
  }
}))

describe('Analysis — loadAllData perde isLoading no finally do filho', () => {
  let analysisStore

  beforeEach(() => {
    setActivePinia(createPinia())
    analysisStore = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('methodologies termina primeiro: isLoading vira false com recommendations e alerts ainda vazios', async () => {
    let resolveRecommendations
    let resolveAlerts
    analysisAPI.getMethodologies.mockResolvedValue({
      data: { success: true, data: [{ id: 'value', name: 'Value' }] }
    })
    analysisAPI.getRecommendations.mockImplementation(
      () => new Promise((resolve) => {
        resolveRecommendations = resolve
      })
    )
    analysisAPI.getAlerts.mockImplementation(
      () => new Promise((resolve) => {
        resolveAlerts = resolve
      })
    )
    analysisAPI.getAnalysisHistory.mockResolvedValue({ data: { success: true, data: [] } })
    analysisAPI.getMarketAnalysis.mockResolvedValue({ data: { success: true, data: null } })
    analysisAPI.getSavedAnalyses.mockResolvedValue({ data: { success: true, data: [] } })

    const loadPromise = analysisStore.loadAllData()
    await flushPromises()

    expect(analysisStore.methodologies).toEqual([{ id: 'value', name: 'Value' }])
    expect(analysisStore.recommendations).toEqual([])
    expect(analysisStore.alerts).toEqual([])
    expect(analysisStore.criticalAlerts).toEqual([])
    expect(analysisStore.recentRecommendations).toEqual([])
    expect(analysisStore.isLoading).toBe(false)

    resolveRecommendations({
      data: {
        success: true,
        data: [{ id: 1, asset: 'PETR4', createdAt: '2026-10-24T10:00:00.000Z' }]
      }
    })
    resolveAlerts({
      data: {
        success: true,
        data: [{ id: 9, priority: 'critical', status: 'active', isRead: false, message: 'VaR' }]
      }
    })
    await loadPromise

    expect(analysisStore.recommendations).toHaveLength(1)
    expect(analysisStore.criticalAlerts).toHaveLength(1)
    expect(analysisStore.isLoading).toBe(false)
  })
})
