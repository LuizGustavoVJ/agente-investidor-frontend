import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const analysisAPI = vi.hoisted(() => ({
  getRecommendations: vi.fn()
}))

vi.mock('@/api/analysis', () => ({ analysisAPI }))

import { useAnalysisStore } from '@/stores/analysis'

describe('analysis — recomendações com shape de objeto derrubam o getter', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('fetchRecommendations com objeto no lugar de array faz recentRecommendations lançar', async () => {
    analysisAPI.getRecommendations.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              id: 1,
              message: 'Comprar ITUB4',
              priority: 'high',
              createdAt: '2026-10-05T09:00:00.000Z'
            }
          ]
        }
      }
    })

    const result = await store.fetchRecommendations()

    expect(result.success).toBe(true)
    expect(store.recommendations).toEqual({
      items: [
        {
          id: 1,
          message: 'Comprar ITUB4',
          priority: 'high',
          createdAt: '2026-10-05T09:00:00.000Z'
        }
      ]
    })
    expect(() => store.recentRecommendations).toThrow()
  })

  it('lista válida ordena pela createdAt mais recente', async () => {
    analysisAPI.getRecommendations.mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 1, message: 'antiga', createdAt: '2026-01-01T00:00:00.000Z' },
          { id: 2, message: 'nova', createdAt: '2026-10-05T00:00:00.000Z' }
        ]
      }
    })

    await store.fetchRecommendations()

    expect(store.recentRecommendations[0].id).toBe(2)
    expect(store.recentRecommendations[0].message).toBe('nova')
  })
})
