import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const portfolioAPI = vi.hoisted(() => ({
  syncBrokers: vi.fn(),
  getSummary: vi.fn(),
  getAllocation: vi.fn(),
  getAssets: vi.fn(),
  getTransactions: vi.fn(),
  getGoals: vi.fn(),
  getEvolution: vi.fn(),
  getPerformance: vi.fn(),
  getDividends: vi.fn(),
  getRiskAnalysis: vi.fn()
}))

vi.mock('@/api/portfolio', () => ({ portfolioAPI }))

import { usePortfolioStore } from '@/stores/portfolio'

const ok = (data) => Promise.resolve({ data: { success: true, data } })

describe('portfolio syncBrokers — não recarrega metas, evolução nem risco', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()

    portfolioAPI.syncBrokers.mockImplementation(() => ok({ synced: 2 }))
    portfolioAPI.getSummary.mockImplementation(() => ok({ totalValue: 20000 }))
    portfolioAPI.getAllocation.mockImplementation(() => ok({ byType: {} }))
    portfolioAPI.getAssets.mockImplementation(() => ok([{ symbol: 'PETR4', currentValue: 5000 }]))
    portfolioAPI.getTransactions.mockImplementation(() => ok([]))
    portfolioAPI.getGoals.mockImplementation(() =>
      ok([{ id: 1, title: 'Casa', targetValue: 150000, status: 'active' }])
    )
    portfolioAPI.getEvolution.mockImplementation(() =>
      ok([{ date: '2026-10-01', value: 18000 }])
    )
    portfolioAPI.getPerformance.mockImplementation(() => ok({ ytd: 8 }))
    portfolioAPI.getDividends.mockImplementation(() => ok([{ amount: 120 }]))
    portfolioAPI.getRiskAnalysis.mockImplementation(() => ok({ score: 30 }))
  })

  it('após sync bem-sucedido só busca resumo, alocação, ativos e transações', async () => {
    const result = await store.syncBrokers()

    expect(result).toEqual({ success: true })
    expect(portfolioAPI.syncBrokers).toHaveBeenCalledTimes(1)
    expect(portfolioAPI.getSummary).toHaveBeenCalled()
    expect(portfolioAPI.getAllocation).toHaveBeenCalled()
    expect(portfolioAPI.getAssets).toHaveBeenCalled()
    expect(portfolioAPI.getTransactions).toHaveBeenCalled()
    expect(portfolioAPI.getGoals).not.toHaveBeenCalled()
    expect(portfolioAPI.getEvolution).not.toHaveBeenCalled()
    expect(portfolioAPI.getPerformance).not.toHaveBeenCalled()
    expect(portfolioAPI.getDividends).not.toHaveBeenCalled()
    expect(portfolioAPI.getRiskAnalysis).not.toHaveBeenCalled()
  })

  it('deixa goals, evolution, performance e riskAnalysis no estado anterior', async () => {
    store.goals = [{ id: 'stale', title: 'Velha', status: 'active' }]
    store.evolution = [{ date: '2025-01-01', value: 1 }]
    store.performance = { ytd: 1 }
    store.riskAnalysis = { score: 1 }

    await store.syncBrokers()

    expect(store.goals).toEqual([{ id: 'stale', title: 'Velha', status: 'active' }])
    expect(store.evolution).toEqual([{ date: '2025-01-01', value: 1 }])
    expect(store.performance).toEqual({ ytd: 1 })
    expect(store.riskAnalysis).toEqual({ score: 1 })
    expect(store.summary).toEqual({ totalValue: 20000 })
  })
})
