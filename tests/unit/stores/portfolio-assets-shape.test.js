import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'

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

describe('Portfolio store — formato de assets e updateGoal órfão', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('topAssets explode se a API devolver objeto em vez de array', async () => {
    portfolioAPI.getAssets.mockResolvedValue({
      data: { success: true, data: { items: [{ symbol: 'PETR4', currentValue: 1000 }] } }
    })

    const store = usePortfolioStore()
    const result = await store.fetchAssets()

    expect(result.success).toBe(true)
    expect(Array.isArray(store.assets)).toBe(false)
    expect(() => store.topAssets).toThrow(TypeError)
  })

  it('topAssets explode se assets for null', async () => {
    portfolioAPI.getAssets.mockResolvedValue({
      data: { success: true, data: null }
    })

    const store = usePortfolioStore()
    await store.fetchAssets()

    expect(() => store.topAssets).toThrow(TypeError)
  })

  it('updateGoal celebra sucesso mesmo quando o id não está na lista local', async () => {
    portfolioAPI.updateGoal.mockResolvedValue({
      data: { success: true, data: { id: 'missing', title: 'Atualizada', targetValue: 10 } }
    })

    const store = usePortfolioStore()
    store.goals = [{ id: 'other', title: 'Outra', targetValue: 1 }]

    const result = await store.updateGoal('missing', { title: 'Atualizada' })

    expect(result.success).toBe(true)
    expect(store.goals).toHaveLength(1)
    expect(store.goals[0].title).toBe('Outra')
  })
})
