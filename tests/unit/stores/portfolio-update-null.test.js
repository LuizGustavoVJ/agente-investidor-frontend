import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn(),
    getAllocation: vi.fn(),
    getEvolution: vi.fn(),
    getAssets: vi.fn(),
    getTransactions: vi.fn(),
    getGoals: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    getPerformance: vi.fn(),
    getRiskAnalysis: vi.fn(),
    syncBrokers: vi.fn()
  }
}))

import { portfolioAPI } from '@/api/portfolio'
import { usePortfolioStore } from '@/stores/portfolio'

describe('Portfolio store — updateGoal com data null', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('sucesso com data:null substitui a meta por null e activeGoals lança', async () => {
    const store = usePortfolioStore()
    store.goals = [
      { id: 1, title: 'Reserva', status: 'active', targetAmount: 10000 }
    ]
    portfolioAPI.updateGoal.mockResolvedValue({
      data: { success: true, data: null }
    })

    const result = await store.updateGoal(1, { title: 'Reserva extra' })

    expect(result.success).toBe(true)
    expect(store.goals[0]).toBeNull()
    expect(() => store.activeGoals).toThrow()
  })
})
