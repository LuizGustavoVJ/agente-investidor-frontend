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
    getDividends: vi.fn(),
    getGoals: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    getPerformance: vi.fn(),
    getRiskAnalysis: vi.fn(),
    getRebalanceSuggestions: vi.fn(),
    applyRebalance: vi.fn(),
    syncBrokers: vi.fn()
  }
}))

describe('Portfolio — rebalance e dividendos existem na API e somem na store', () => {
  let portfolioStore

  beforeEach(() => {
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
    vi.clearAllMocks()
    portfolioStore.dividends = [
      { id: 1, symbol: 'ITUB4', amount: 120.5, date: '2026-09-15' }
    ]
    portfolioStore.allocation = {
      byType: { stocks: { percentage: 70 }, fiis: { percentage: 30 } }
    }
  })

  it('store não expõe applyRebalance nem getRebalanceSuggestions — a API existe e a alocação local não muda', () => {
    expect(typeof portfolioAPI.applyRebalance).toBe('function')
    expect(typeof portfolioAPI.getRebalanceSuggestions).toBe('function')

    expect(portfolioStore.applyRebalance).toBeUndefined()
    expect(portfolioStore.getRebalanceSuggestions).toBeUndefined()
    expect(portfolioStore.assetsByType).toEqual({
      stocks: { percentage: 70 },
      fiis: { percentage: 30 }
    })
  })

  it('store guarda dividends mas não expõe fetchDividends — getDividends da API nunca hidrata o estado', () => {
    expect(typeof portfolioAPI.getDividends).toBe('function')
    expect(portfolioStore.fetchDividends).toBeUndefined()
    expect(portfolioStore.dividends).toEqual([
      { id: 1, symbol: 'ITUB4', amount: 120.5, date: '2026-09-15' }
    ])
  })
})
