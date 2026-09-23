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

describe('Portfolio — recentTransactions com data inválida e sort in-place', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('data inválida não é filtrada e o getter não lança', () => {
    const store = usePortfolioStore()
    store.transactions = [
      { id: 1, date: '2026-03-01', amount: 100 },
      { id: 2, date: 'not-a-date', amount: 200 },
      { id: 3, date: '2026-01-01', amount: 300 }
    ]

    expect(() => store.recentTransactions).not.toThrow()
    expect(store.recentTransactions).toHaveLength(3)
    expect(store.recentTransactions.map((t) => t.id)).toContain(2)
  })

  it('o sort do getter muta o array original de transações', () => {
    const store = usePortfolioStore()
    const original = [
      { id: 1, date: '2024-01-01', amount: 10 },
      { id: 2, date: '2024-06-01', amount: 20 }
    ]
    store.transactions = original

    const recent = store.recentTransactions

    expect(recent[0].id).toBe(2)
    expect(original[0].id).toBe(2)
    expect(store.transactions[0].id).toBe(2)
  })

  it('data ausente (undefined) também entra no recorte das 10 mais recentes', () => {
    const store = usePortfolioStore()
    store.transactions = [
      { id: 1, date: '2026-09-01' },
      { id: 2 }
    ]

    expect(store.recentTransactions.map((t) => t.id)).toEqual(
      expect.arrayContaining([1, 2])
    )
  })
})
