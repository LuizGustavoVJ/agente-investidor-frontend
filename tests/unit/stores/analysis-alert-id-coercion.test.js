import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    markAlertAsRead: vi.fn()
  }
}))

import { analysisAPI } from '@/api/analysis'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis store — id de alerta string vs número', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('markAlertAsRead("1") não marca o alerta local numérico após sucesso da API', async () => {
    analysisAPI.markAlertAsRead.mockResolvedValue({ data: { success: true } })
    const store = useAnalysisStore()
    store.alerts = [
      { id: 1, isRead: false, status: 'active', priority: 'critical' }
    ]

    const result = await store.markAlertAsRead('1')

    expect(result.success).toBe(true)
    expect(analysisAPI.markAlertAsRead).toHaveBeenCalledWith('1')
    expect(store.alerts[0].isRead).toBe(false)
    expect(store.alerts[0].readAt).toBeUndefined()
  })
})
