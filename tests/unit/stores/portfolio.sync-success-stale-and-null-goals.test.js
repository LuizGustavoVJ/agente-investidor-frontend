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

const fail = (message) => ({ data: { success: false, message } })
const ok = (data) => ({ data: { success: true, data } })

describe('Portfolio: sync mente sucesso, fetch falho deixa stale, goals null derruba getter', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  it('syncBrokers retorna success mesmo quando todos os reloads pós-sync falham', async () => {
    store.summary = { totalValue: 250000, totalGain: 8000 }
    portfolioAPI.syncBrokers.mockResolvedValue(ok({ synced: true }))
    portfolioAPI.getSummary.mockResolvedValue(fail('resumo indisponível'))
    portfolioAPI.getAllocation.mockResolvedValue(fail('alocação indisponível'))
    portfolioAPI.getAssets.mockResolvedValue(fail('ativos indisponíveis'))
    portfolioAPI.getTransactions.mockResolvedValue(fail('transações indisponíveis'))

    const result = await store.syncBrokers()

    expect(result.success).toBe(true)
    expect(store.summary.totalValue).toBe(250000)
    expect(store.totalValue).toBe(250000)
    expect(store.error).toBe('transações indisponíveis')
  })

  it('fetchSummary {success:false} preserva o patrimônio anterior em totalValue', async () => {
    store.summary = { totalValue: 180000.5, totalGain: 1200 }
    portfolioAPI.getSummary.mockResolvedValue(fail('token da corretora expirou'))

    const result = await store.fetchSummary()

    expect(result.success).toBe(false)
    expect(store.summary).toEqual({ totalValue: 180000.5, totalGain: 1200 })
    expect(store.totalValue).toBe(180000.5)
    expect(store.totalGain).toBe(1200)
    expect(store.error).toBe('token da corretora expirou')
  })

  it('fetchGoals success com data:null faz activeGoals lançar', async () => {
    portfolioAPI.getGoals.mockResolvedValue(ok(null))

    const result = await store.fetchGoals()

    expect(result.success).toBe(true)
    expect(store.goals).toBeNull()
    expect(() => store.activeGoals).toThrow()
    expect(() => store.completedGoals).toThrow()
  })
})
