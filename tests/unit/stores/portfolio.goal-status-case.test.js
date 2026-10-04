import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const portfolioAPI = vi.hoisted(() => ({
  createGoal: vi.fn(),
  getGoals: vi.fn()
}))

vi.mock('@/api/portfolio', () => ({ portfolioAPI }))

import { usePortfolioStore } from '@/stores/portfolio'

describe('portfolio — status de meta e shape de coleção', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  it('createGoal sem status não entra em activeGoals', async () => {
    portfolioAPI.createGoal.mockResolvedValue({
      data: {
        success: true,
        data: { id: 99, title: 'Viagem', targetValue: 25000 }
      }
    })

    const result = await store.createGoal({ title: 'Viagem', targetValue: 25000 })

    expect(result.success).toBe(true)
    expect(store.goals).toHaveLength(1)
    expect(store.activeGoals).toEqual([])
  })

  it('status ACTIVE ou Active não conta como ativa (=== active)', async () => {
    portfolioAPI.createGoal
      .mockResolvedValueOnce({
        data: { success: true, data: { id: 1, title: 'A', status: 'ACTIVE' } }
      })
      .mockResolvedValueOnce({
        data: { success: true, data: { id: 2, title: 'B', status: 'Active' } }
      })
      .mockResolvedValueOnce({
        data: { success: true, data: { id: 3, title: 'C', status: 'active' } }
      })

    await store.createGoal({ title: 'A' })
    await store.createGoal({ title: 'B' })
    await store.createGoal({ title: 'C' })

    expect(store.goals).toHaveLength(3)
    expect(store.activeGoals.map((g) => g.id)).toEqual([3])
  })

  it('fetchGoals com objeto no lugar de array faz activeGoals lançar', async () => {
    portfolioAPI.getGoals.mockResolvedValue({
      data: { success: true, data: { items: [] } }
    })

    const result = await store.fetchGoals()
    expect(result.success).toBe(true)
    expect(() => store.activeGoals).toThrow()
  })
})
