import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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

import { analysisAPI } from '@/api/analysis'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis store — itens nulos em coleções', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('activeAlerts lança se a API devolver um alerta null no array', async () => {
    analysisAPI.getAlerts.mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 1, isRead: false, status: 'active', priority: 'critical' },
          null
        ]
      }
    })

    const store = useAnalysisStore()
    const result = await store.fetchAlerts()

    expect(result.success).toBe(true)
    expect(() => store.activeAlerts).toThrow()
  })

  it('methodologiesByCategory lança se uma metodologia da lista for null', async () => {
    analysisAPI.getMethodologies.mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 1, name: 'Value', category: 'value' },
          null
        ]
      }
    })

    const store = useAnalysisStore()
    const result = await store.fetchMethodologies()

    expect(result.success).toBe(true)
    expect(() => store.methodologiesByCategory).toThrow()
  })
})
