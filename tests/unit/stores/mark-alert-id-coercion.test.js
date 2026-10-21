import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'
import { analysisAPI } from '@/api/analysis'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    markAlertAsRead: vi.fn(),
    getMethodologies: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getMarketAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn()
  }
}))

describe('Analysis — markAlertAsRead com id string vs número', () => {
  let analysisStore

  beforeEach(() => {
    setActivePinia(createPinia())
    analysisStore = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('API ok com id "1" e alerta id 1: devolve sucesso e o crítico permanece não lido', async () => {
    analysisStore.alerts = [
      {
        id: 1,
        message: 'Queda de 8% em PETR4',
        isRead: false,
        status: 'active',
        priority: 'critical'
      }
    ]
    analysisAPI.markAlertAsRead.mockResolvedValue({
      data: { success: true }
    })

    const result = await analysisStore.markAlertAsRead('1')

    expect(analysisAPI.markAlertAsRead).toHaveBeenCalledWith('1')
    expect(result).toEqual({ success: true })
    expect(analysisStore.alerts[0].isRead).toBe(false)
    expect(analysisStore.alerts[0].readAt).toBeUndefined()
    expect(analysisStore.activeAlerts).toHaveLength(1)
    expect(analysisStore.criticalAlerts).toEqual([
      expect.objectContaining({ id: 1, isRead: false, message: 'Queda de 8% em PETR4' })
    ])
  })

  it('id numérico 1 marca o mesmo alerta e o tira de criticalAlerts', async () => {
    analysisStore.alerts = [
      {
        id: 1,
        message: 'Queda de 8% em PETR4',
        isRead: false,
        status: 'active',
        priority: 'critical'
      }
    ]
    analysisAPI.markAlertAsRead.mockResolvedValue({
      data: { success: true }
    })

    const result = await analysisStore.markAlertAsRead(1)

    expect(result.success).toBe(true)
    expect(analysisStore.alerts[0].isRead).toBe(true)
    expect(analysisStore.alerts[0].readAt).toBeInstanceOf(Date)
    expect(analysisStore.criticalAlerts).toEqual([])
  })
})
