import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'
import { portfolioAPI } from '@/api/portfolio'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn(),
    getAllocation: vi.fn(),
    getEvolution: vi.fn(),
    getAssets: vi.fn(),
    getTransactions: vi.fn(),
    getGoals: vi.fn(),
    getPerformance: vi.fn(),
    getDividends: vi.fn(),
    getRiskAnalysis: vi.fn(),
    syncBrokers: vi.fn()
  }
}))

const ok = (data = {}) => ({ data: { success: true, data } })

describe('Portfolio store — refresh após sync de corretoras', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()

    portfolioAPI.syncBrokers.mockResolvedValue(ok())
    portfolioAPI.getSummary.mockResolvedValue(ok({ totalValue: 10 }))
    portfolioAPI.getAllocation.mockResolvedValue(ok({ byType: {} }))
    portfolioAPI.getAssets.mockResolvedValue(ok([]))
    portfolioAPI.getTransactions.mockResolvedValue(ok([]))
    portfolioAPI.getEvolution.mockResolvedValue(ok([]))
    portfolioAPI.getGoals.mockResolvedValue(ok([]))
    portfolioAPI.getPerformance.mockResolvedValue(ok({}))
    portfolioAPI.getDividends.mockResolvedValue(ok([]))
    portfolioAPI.getRiskAnalysis.mockResolvedValue(ok({}))
  })

  it('após sync bem-sucedido não recarrega metas, dividendos, risco, evolução nem performance', async () => {
    store.goals = [{ id: 1, status: 'active', targetValue: 1000 }]
    store.dividends = [{ id: 'old-div' }]
    store.riskAnalysis = { score: 99 }
    store.evolution = [{ date: '2020-01-01', value: 1 }]
    store.performance = { stale: true }

    const result = await store.syncBrokers()

    expect(result.success).toBe(true)
    expect(portfolioAPI.syncBrokers).toHaveBeenCalledTimes(1)
    expect(portfolioAPI.getSummary).toHaveBeenCalled()
    expect(portfolioAPI.getAllocation).toHaveBeenCalled()
    expect(portfolioAPI.getAssets).toHaveBeenCalled()
    expect(portfolioAPI.getTransactions).toHaveBeenCalled()

    expect(portfolioAPI.getGoals).not.toHaveBeenCalled()
    expect(portfolioAPI.getDividends).not.toHaveBeenCalled()
    expect(portfolioAPI.getRiskAnalysis).not.toHaveBeenCalled()
    expect(portfolioAPI.getEvolution).not.toHaveBeenCalled()
    expect(portfolioAPI.getPerformance).not.toHaveBeenCalled()

    expect(store.goals).toHaveLength(1)
    expect(store.dividends).toEqual([{ id: 'old-div' }])
    expect(store.riskAnalysis).toEqual({ score: 99 })
    expect(store.evolution).toEqual([{ date: '2020-01-01', value: 1 }])
    expect(store.performance).toEqual({ stale: true })
  })

  it('não existe fetchDividends — o estado dividends nunca é hidratado pela store', () => {
    expect(store.fetchDividends).toBeUndefined()
    expect(typeof store.fetchRiskAnalysis).toBe('function')
    expect(store.loadAllData.toString()).not.toMatch(/fetchDividends|fetchRiskAnalysis/)
  })
})
