import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

describe('Analysis: readAt do cliente e saveAnalysis duplica id', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-24T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('markAlertAsRead grava new Date() local e descarta readAt do servidor', async () => {
    store.alerts = [
      { id: 7, isRead: false, status: 'active', priority: 'critical', readAt: null }
    ]

    analysisAPI.markAlertAsRead.mockResolvedValue({
      data: {
        success: true,
        data: { readAt: '2024-01-01T12:00:00.000Z' }
      }
    })

    const result = await store.markAlertAsRead(7)

    expect(result.success).toBe(true)
    expect(store.alerts[0].isRead).toBe(true)
    expect(store.alerts[0].readAt).toEqual(new Date('2026-11-24T10:00:00.000Z'))
    expect(store.alerts[0].readAt.toISOString()).not.toBe('2024-01-01T12:00:00.000Z')
  })

  it('saveAnalysis dá push mesmo quando a API devolve o mesmo id — duplicata na lista', async () => {
    const saved = { id: 'an-1', title: 'PETR4 value' }
    analysisAPI.saveAnalysis.mockResolvedValue({
      data: { success: true, data: saved }
    })

    await store.saveAnalysis({ title: 'PETR4 value' })
    await store.saveAnalysis({ title: 'PETR4 value' })

    expect(store.savedAnalyses).toHaveLength(2)
    expect(store.savedAnalyses.map((item) => item.id)).toEqual(['an-1', 'an-1'])
  })
})
