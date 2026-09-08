import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    markAlertAsRead: vi.fn(),
    getAssetAnalysis: vi.fn(),
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

describe('Analysis Store — alerta inexistente e análise de ativo', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('markAlertAsRead com id desconhecido não altera os alertas existentes', async () => {
    store.alerts = [
      { id: 1, isRead: false, status: 'active', priority: 'critical' }
    ]
    analysisAPI.markAlertAsRead.mockResolvedValue({ data: { success: true } })

    const result = await store.markAlertAsRead(99)

    expect(result.success).toBe(true)
    expect(store.alerts[0].isRead).toBe(false)
    expect(store.alerts[0].readAt).toBeUndefined()
  })

  it('markAlertAsRead não marca como lido quando a API recusa', async () => {
    store.alerts = [{ id: 1, isRead: false, status: 'active' }]
    analysisAPI.markAlertAsRead.mockResolvedValue({
      data: { success: false, message: 'Alerta expirado' }
    })

    const result = await store.markAlertAsRead(1)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Alerta expirado')
    expect(store.alerts[0].isRead).toBe(false)
  })

  it('fetchAssetAnalysis com metodologias vazias não grava currentAnalysis', async () => {
    analysisAPI.getAssetAnalysis.mockResolvedValue({
      data: { success: true, data: { symbol: 'PETR4', score: 72 } }
    })

    const result = await store.fetchAssetAnalysis('PETR4')

    expect(analysisAPI.getAssetAnalysis).toHaveBeenCalledWith('PETR4', [])
    expect(result).toEqual({ success: true, data: { symbol: 'PETR4', score: 72 } })
    expect(store.currentAnalysis).toBeNull()
  })
})
