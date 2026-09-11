import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
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
    getRiskAnalysis: vi.fn()
  }
}))

const ok = (data = []) => ({ data: { success: true, data } })

describe('Portfolio — loadAllData omite dividendos e risco', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()

    portfolioAPI.getSummary.mockResolvedValue(ok({ totalValue: 1000 }))
    portfolioAPI.getAllocation.mockResolvedValue(ok({ byType: {} }))
    portfolioAPI.getEvolution.mockResolvedValue(ok([]))
    portfolioAPI.getAssets.mockResolvedValue(ok([]))
    portfolioAPI.getTransactions.mockResolvedValue(ok([]))
    portfolioAPI.getGoals.mockResolvedValue(ok([]))
    portfolioAPI.getPerformance.mockResolvedValue(ok({}))
    portfolioAPI.getDividends.mockResolvedValue(ok([{ id: 'div-1', amount: 50 }]))
    portfolioAPI.getRiskAnalysis.mockResolvedValue(ok({ score: 12 }))
  })

  it('loadAllData devolve sucesso sem buscar dividendos nem análise de risco', async () => {
    store.dividends = [{ id: 'stale' }]
    store.riskAnalysis = { score: 99 }

    const result = await store.loadAllData()

    expect(result).toEqual({ success: true })
    expect(portfolioAPI.getSummary).toHaveBeenCalled()
    expect(portfolioAPI.getAllocation).toHaveBeenCalled()
    expect(portfolioAPI.getEvolution).toHaveBeenCalled()
    expect(portfolioAPI.getAssets).toHaveBeenCalled()
    expect(portfolioAPI.getTransactions).toHaveBeenCalled()
    expect(portfolioAPI.getGoals).toHaveBeenCalled()
    expect(portfolioAPI.getPerformance).toHaveBeenCalled()
    expect(portfolioAPI.getDividends).not.toHaveBeenCalled()
    expect(portfolioAPI.getRiskAnalysis).not.toHaveBeenCalled()
    expect(store.dividends).toEqual([{ id: 'stale' }])
    expect(store.riskAnalysis).toEqual({ score: 99 })
  })
})
