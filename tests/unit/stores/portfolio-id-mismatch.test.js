import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    deleteGoal: vi.fn(),
    updateGoal: vi.fn(),
    getSummary: vi.fn(),
    getAllocation: vi.fn(),
    getEvolution: vi.fn(),
    getAssets: vi.fn(),
    getTransactions: vi.fn(),
    getGoals: vi.fn(),
    getPerformance: vi.fn()
  }
}))

import { portfolioAPI } from '@/api/portfolio'
import { usePortfolioStore } from '@/stores/portfolio'

describe('Portfolio Store — id string vs número e topAssets incompleto', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  it('deleteGoal com id string não remove a meta local numérica após sucesso da API', async () => {
    store.goals = [
      { id: 1, title: 'Reserva', status: 'active' },
      { id: 2, title: 'Casa', status: 'active' }
    ]
    portfolioAPI.deleteGoal.mockResolvedValue({ data: { success: true } })

    const result = await store.deleteGoal('1')

    expect(result.success).toBe(true)
    expect(portfolioAPI.deleteGoal).toHaveBeenCalledWith('1')
    expect(store.goals.map((goal) => goal.id)).toEqual([1, 2])
  })

  it('updateGoal com id string não substitui a meta local numérica', async () => {
    store.goals = [{ id: 1, title: 'Reserva', targetValue: 10000 }]
    portfolioAPI.updateGoal.mockResolvedValue({
      data: { success: true, data: { id: 1, title: 'Reserva atualizada', targetValue: 12000 } }
    })

    const result = await store.updateGoal('1', { title: 'Reserva atualizada' })

    expect(result.success).toBe(true)
    expect(result.data.title).toBe('Reserva atualizada')
    expect(store.goals[0].title).toBe('Reserva')
    expect(store.goals[0].targetValue).toBe(10000)
  })

  it('topAssets não lança quando currentValue está ausente', () => {
    store.assets = [
      { symbol: 'PETR4' },
      { symbol: 'VALE3', currentValue: 8000 },
      { symbol: 'ITUB4', currentValue: 3000 }
    ]

    expect(() => store.topAssets).not.toThrow()
    expect(store.topAssets).toHaveLength(3)
    expect(store.topAssets.map((asset) => asset.symbol)).toEqual(
      expect.arrayContaining(['PETR4', 'VALE3', 'ITUB4'])
    )
  })
})
