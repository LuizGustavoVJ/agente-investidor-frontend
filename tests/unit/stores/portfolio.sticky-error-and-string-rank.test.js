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

const ok = (data) => ({ data: { success: true, data } })
const fail = (message) => ({ data: { success: false, message } })

describe('Portfolio: error sticky nos fetches filhos e ranking com string pt-BR', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchSummary com falha grava error; fetchAssets/transactions/goals com sucesso não limpam', async () => {
    const store = usePortfolioStore()
    portfolioAPI.getSummary.mockResolvedValue(fail('resumo indisponível'))
    await store.fetchSummary()
    expect(store.error).toBe('resumo indisponível')

    portfolioAPI.getAssets.mockResolvedValue(ok([{ symbol: 'PETR4', currentValue: 1200 }]))
    portfolioAPI.getTransactions.mockResolvedValue(ok([{ id: 1, date: '2026-01-01' }]))
    portfolioAPI.getGoals.mockResolvedValue(ok([{ id: 1, status: 'active' }]))

    expect((await store.fetchAssets()).success).toBe(true)
    expect((await store.fetchTransactions()).success).toBe(true)
    expect((await store.fetchGoals()).success).toBe(true)

    expect(store.assets).toHaveLength(1)
    expect(store.transactions).toHaveLength(1)
    expect(store.goals).toHaveLength(1)
    expect(store.error).toBe('resumo indisponível')
  })

  it('fetchEvolution/performance/risk com sucesso também deixam error sticky', async () => {
    const store = usePortfolioStore()
    store.error = 'falha anterior'

    portfolioAPI.getEvolution.mockResolvedValue(ok([{ date: '2026-01-01', value: 10 }]))
    portfolioAPI.getPerformance.mockResolvedValue(ok({ total: 0.12 }))
    portfolioAPI.getRiskAnalysis.mockResolvedValue(ok({ var: 0.03 }))

    expect((await store.fetchEvolution()).success).toBe(true)
    expect((await store.fetchPerformance()).success).toBe(true)
    expect((await store.fetchRiskAnalysis()).success).toBe(true)

    expect(store.evolution).toHaveLength(1)
    expect(store.performance).toEqual({ total: 0.12 })
    expect(store.riskAnalysis).toEqual({ var: 0.03 })
    expect(store.error).toBe('falha anterior')
  })

  it('fetchSummary com sucesso limpa error no início — os filhos não têm esse reset', async () => {
    const store = usePortfolioStore()
    store.error = 'falha anterior'
    portfolioAPI.getSummary.mockResolvedValue(ok({ totalValue: 50000 }))

    const result = await store.fetchSummary()

    expect(result.success).toBe(true)
    expect(store.error).toBeNull()
    expect(store.totalValue).toBe(50000)
  })

  it('topAssets trata "1.000" (mil em pt-BR) como 1 e ranqueia abaixo de 50', () => {
    const store = usePortfolioStore()
    store.assets = [
      { symbol: 'VALE3', currentValue: '1.000' },
      { symbol: 'PETR4', currentValue: 50 },
      { symbol: 'ITUB4', currentValue: '9' }
    ]

    const ranked = store.topAssets.map((asset) => asset.symbol)

    expect(ranked).toEqual(['PETR4', 'ITUB4', 'VALE3'])
  })

  it('topAssets muta o array original via sort in-place', () => {
    const store = usePortfolioStore()
    const original = [
      { symbol: 'LOW', currentValue: 10 },
      { symbol: 'HIGH', currentValue: 90 }
    ]
    store.assets = original

    expect(store.topAssets[0].symbol).toBe('HIGH')
    expect(original[0].symbol).toBe('HIGH')
  })

  it('recentTransactions com data inválida não lança, mas a ordem fica indefinida pelo NaN do sort', () => {
    const store = usePortfolioStore()
    store.transactions = [
      { id: 1, date: '2026-01-01', ticker: 'A' },
      { id: 2, date: 'not-a-date', ticker: 'B' },
      { id: 3, date: '2026-06-01', ticker: 'C' }
    ]

    expect(() => store.recentTransactions).not.toThrow()
    expect(store.recentTransactions).toHaveLength(3)
    expect(store.recentTransactions.some((tx) => tx.ticker === 'B')).toBe(true)
  })
})
