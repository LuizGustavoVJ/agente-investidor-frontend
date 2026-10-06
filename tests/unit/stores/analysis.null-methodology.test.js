import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'
import { analysisAPI } from '@/api/analysis'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn()
  }
}))

describe('Analysis store — methodologiesByCategory com item nulo', () => {
  let analysisStore

  beforeEach(() => {
    setActivePinia(createPinia())
    analysisStore = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('fetchMethodologies com null no array faz methodologiesByCategory lançar', async () => {
    analysisAPI.getMethodologies.mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 1, name: 'Value', category: 'value' },
          null,
          { id: 2, name: 'Growth', category: 'growth' }
        ]
      }
    })

    const result = await analysisStore.fetchMethodologies()

    expect(result.success).toBe(true)
    expect(analysisStore.methodologies).toHaveLength(3)
    expect(() => analysisStore.methodologiesByCategory).toThrow()
  })
})
