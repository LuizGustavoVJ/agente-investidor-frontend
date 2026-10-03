import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const portfolioAPI = vi.hoisted(() => ({
  getSummary: vi.fn(),
  getAllocation: vi.fn(),
  getEvolution: vi.fn(),
  getAssets: vi.fn(),
  getTransactions: vi.fn(),
  getGoals: vi.fn(),
  getPerformance: vi.fn(),
  getDividends: vi.fn(),
  getRiskAnalysis: vi.fn()
}))

vi.mock('@/api/portfolio', () => ({ portfolioAPI }))

import { usePortfolioStore } from '@/stores/portfolio'

const ok = (data) => Promise.resolve({ data: { success: true, data } })

describe('portfolio loadAllData — omite dividendos e risco', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()

    portfolioAPI.getSummary.mockImplementation(() => ok({ totalValue: 10000 }))
    portfolioAPI.getAllocation.mockImplementation(() => ok({ byType: {} }))
    portfolioAPI.getEvolution.mockImplementation(() => ok([]))
    portfolioAPI.getAssets.mockImplementation(() => ok([]))
    portfolioAPI.getTransactions.mockImplementation(() => ok([]))
    portfolioAPI.getGoals.mockImplementation(() => ok([]))
    portfolioAPI.getPerformance.mockImplementation(() => ok({}))
    portfolioAPI.getDividends.mockImplementation(() =>
      ok([{ id: 'div-1', amount: 250 }])
    )
    portfolioAPI.getRiskAnalysis.mockImplementation(() =>
      ok({ score: 42, level: 'moderate' })
    )
  })

  it('não chama getDividends nem getRiskAnalysis mesmo com API disponível', async () => {
    const result = await store.loadAllData()

    expect(result).toEqual({ success: true })
    expect(portfolioAPI.getSummary).toHaveBeenCalled()
    expect(portfolioAPI.getGoals).toHaveBeenCalled()
    expect(portfolioAPI.getDividends).not.toHaveBeenCalled()
    expect(portfolioAPI.getRiskAnalysis).not.toHaveBeenCalled()
  })

  it('deixa dividends vazio e riskAnalysis nulo após load bem-sucedido', async () => {
    await store.loadAllData()

    expect(store.dividends).toEqual([])
    expect(store.riskAnalysis).toBeNull()
    expect(store.fetchDividends).toBeUndefined()
    expect(typeof store.fetchRiskAnalysis).toBe('function')
  })

  it('fetchRiskAnalysis isolado preenche riskAnalysis, mas loadAllData não o usa', async () => {
    await store.fetchRiskAnalysis()
    expect(store.riskAnalysis).toEqual({ score: 42, level: 'moderate' })

    store.riskAnalysis = null
    await store.loadAllData()

    expect(portfolioAPI.getRiskAnalysis).toHaveBeenCalledTimes(1)
    expect(store.riskAnalysis).toBeNull()
  })
})
