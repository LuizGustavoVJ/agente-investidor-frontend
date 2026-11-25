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

import { usePortfolioStore } from '@/stores/portfolio'
import { portfolioAPI } from '@/api/portfolio'

describe('Portfolio: data null em assets quebra topAssets', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  it('fetchAssets success com data:null faz topAssets lançar ao ordenar', async () => {
    portfolioAPI.getAssets.mockResolvedValue({
      data: { success: true, data: null }
    })

    const result = await store.fetchAssets()

    expect(result.success).toBe(true)
    expect(store.assets).toBeNull()
    expect(() => store.topAssets).toThrow()
  })

  it('fetchTransactions success com data:null faz recentTransactions lançar ao ordenar', async () => {
    portfolioAPI.getTransactions.mockResolvedValue({
      data: { success: true, data: null }
    })

    const result = await store.fetchTransactions()

    expect(result.success).toBe(true)
    expect(store.transactions).toBeNull()
    expect(() => store.recentTransactions).toThrow()
  })
})
