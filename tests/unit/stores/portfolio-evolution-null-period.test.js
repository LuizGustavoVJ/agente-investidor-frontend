import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getEvolution: vi.fn(),
    getPerformance: vi.fn()
  }
}))

import { usePortfolioStore } from '@/stores/portfolio'
import { portfolioAPI } from '@/api/portfolio'

describe('Portfolio store — fetchEvolution/fetchPerformance com period nulo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchEvolution() sem argumento encaminha o default 1Y', async () => {
    portfolioAPI.getEvolution.mockResolvedValue({
      data: { success: true, data: [{ date: '2026-01-01', value: 1000 }] }
    })

    const store = usePortfolioStore()
    await store.fetchEvolution()

    expect(portfolioAPI.getEvolution).toHaveBeenCalledWith('1Y')
  })

  it('fetchEvolution(null) encaminha null e não cai no default 1Y', async () => {
    portfolioAPI.getEvolution.mockResolvedValue({
      data: { success: true, data: [] }
    })

    const store = usePortfolioStore()
    const result = await store.fetchEvolution(null)

    expect(portfolioAPI.getEvolution).toHaveBeenCalledWith(null)
    expect(result.success).toBe(true)
  })

  it('fetchPerformance(null) encaminha null e não cai no default 1Y', async () => {
    portfolioAPI.getPerformance.mockResolvedValue({
      data: { success: true, data: { return: 0.12 } }
    })

    const store = usePortfolioStore()
    const result = await store.fetchPerformance(null)

    expect(portfolioAPI.getPerformance).toHaveBeenCalledWith(null)
    expect(result.success).toBe(true)
  })
})
