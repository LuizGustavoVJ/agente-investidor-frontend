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
    getRiskAnalysis: vi.fn(),
    getDividends: vi.fn(),
    syncBrokers: vi.fn()
  }
}))

const staleGoals = [
  { id: 1, title: 'Reserva', targetValue: 30000, currentValue: 5000, status: 'active' }
]
const staleEvolution = [{ date: '2026-01-01', value: 40000 }]
const stalePerformance = { period: '1Y', return: 0.12 }
const staleRisk = { score: 7, var: 0.08 }
const staleDividends = [{ symbol: 'ITUB4', amount: 120 }]

describe('Portfolio — topAssets muta a lista e sync deixa metas/risco stale', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  it('topAssets faz sort in-place e reordena o array canônico de assets', () => {
    store.assets = [
      { symbol: 'PETR4', currentValue: 10000 },
      { symbol: 'VALE3', currentValue: 50000 },
      { symbol: 'ITUB4', currentValue: 20000 }
    ]

    expect(store.assets.map((asset) => asset.symbol)).toEqual(['PETR4', 'VALE3', 'ITUB4'])

    const ranked = store.topAssets

    expect(ranked.map((asset) => asset.symbol)).toEqual(['VALE3', 'ITUB4', 'PETR4'])
    expect(store.assets.map((asset) => asset.symbol)).toEqual(['VALE3', 'ITUB4', 'PETR4'])
    expect(store.assets[0]).toBe(ranked[0])
    expect(store.assets).toHaveLength(3)
  })

  it('ler topAssets de novo não recoloca PETR4 no topo da fonte', () => {
    store.assets = [
      { symbol: 'PETR4', currentValue: 10000 },
      { symbol: 'VALE3', currentValue: 50000 }
    ]

    void store.topAssets
    void store.topAssets

    expect(store.assets[0].symbol).toBe('VALE3')
    expect(store.assets[1].symbol).toBe('PETR4')
  })

  it('syncBrokers sucesso recarrega só resumo/alocação/ativos/transações — metas, evolução, risco e dividendos ficam iguais', async () => {
    store.goals = staleGoals
    store.evolution = staleEvolution
    store.performance = stalePerformance
    store.riskAnalysis = staleRisk
    store.dividends = staleDividends
    store.summary = { totalValue: 80000 }
    store.allocation = { byType: {} }
    store.assets = [{ symbol: 'PETR4', currentValue: 10000 }]
    store.transactions = [{ id: 1, date: '2026-01-01' }]

    portfolioAPI.syncBrokers.mockResolvedValue({ data: { success: true } })
    portfolioAPI.getSummary.mockResolvedValue({
      data: { success: true, data: { totalValue: 95000 } }
    })
    portfolioAPI.getAllocation.mockResolvedValue({
      data: { success: true, data: { byType: { stocks: { percentage: 60 } } } }
    })
    portfolioAPI.getAssets.mockResolvedValue({
      data: { success: true, data: [{ symbol: 'VALE3', currentValue: 40000 }] }
    })
    portfolioAPI.getTransactions.mockResolvedValue({
      data: { success: true, data: [{ id: 9, date: '2026-10-19' }] }
    })

    const result = await store.syncBrokers()

    expect(result.success).toBe(true)
    expect(store.summary.totalValue).toBe(95000)
    expect(store.assets[0].symbol).toBe('VALE3')
    expect(store.transactions[0].id).toBe(9)

    expect(store.goals).toEqual(staleGoals)
    expect(store.evolution).toEqual(staleEvolution)
    expect(store.performance).toEqual(stalePerformance)
    expect(store.riskAnalysis).toEqual(staleRisk)
    expect(store.dividends).toEqual(staleDividends)

    expect(portfolioAPI.getGoals).not.toHaveBeenCalled()
    expect(portfolioAPI.getEvolution).not.toHaveBeenCalled()
    expect(portfolioAPI.getPerformance).not.toHaveBeenCalled()
    expect(portfolioAPI.getRiskAnalysis).not.toHaveBeenCalled()
    expect(portfolioAPI.getDividends).not.toHaveBeenCalled()
  })
})
