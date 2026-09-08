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
    getPerformance: vi.fn(),
    getRiskAnalysis: vi.fn(),
    getDividends: vi.fn(),
    syncBrokers: vi.fn()
  }
}))

import { portfolioAPI } from '@/api/portfolio'
import { usePortfolioStore } from '@/stores/portfolio'

const success = (data) => ({ data: { success: true, data } })

describe('Portfolio Store — loadAllData, evolução e sync', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()

    portfolioAPI.getSummary.mockResolvedValue(success({ totalValue: 1000 }))
    portfolioAPI.getAllocation.mockResolvedValue(success({ byType: {} }))
    portfolioAPI.getEvolution.mockResolvedValue(success([]))
    portfolioAPI.getAssets.mockResolvedValue(success([]))
    portfolioAPI.getTransactions.mockResolvedValue(success([]))
    portfolioAPI.getGoals.mockResolvedValue(success([]))
    portfolioAPI.getPerformance.mockResolvedValue(success({ ytd: 0 }))
    portfolioAPI.getRiskAnalysis.mockResolvedValue(success({ volatility: 12 }))
    portfolioAPI.getDividends.mockResolvedValue(success([{ id: 1 }]))
  })

  it('loadAllData não busca dividendos nem análise de risco', async () => {
    const result = await store.loadAllData()

    expect(result.success).toBe(true)
    expect(portfolioAPI.getSummary).toHaveBeenCalled()
    expect(portfolioAPI.getAllocation).toHaveBeenCalled()
    expect(portfolioAPI.getEvolution).toHaveBeenCalled()
    expect(portfolioAPI.getAssets).toHaveBeenCalled()
    expect(portfolioAPI.getTransactions).toHaveBeenCalled()
    expect(portfolioAPI.getGoals).toHaveBeenCalled()
    expect(portfolioAPI.getPerformance).toHaveBeenCalled()
    expect(portfolioAPI.getDividends).not.toHaveBeenCalled()
    expect(portfolioAPI.getRiskAnalysis).not.toHaveBeenCalled()
    expect(store.dividends).toEqual([])
    expect(store.riskAnalysis).toBeNull()
  })

  it('fetchEvolution usa período 1Y quando nenhum é informado', async () => {
    await store.fetchEvolution()

    expect(portfolioAPI.getEvolution).toHaveBeenCalledWith('1Y')
  })

  it('syncBrokers recarrega resumo, alocação, ativos e transações após sucesso', async () => {
    portfolioAPI.syncBrokers.mockResolvedValue(success({ synced: true }))

    const result = await store.syncBrokers()

    expect(result.success).toBe(true)
    expect(portfolioAPI.syncBrokers).toHaveBeenCalled()
    expect(portfolioAPI.getSummary).toHaveBeenCalled()
    expect(portfolioAPI.getAllocation).toHaveBeenCalled()
    expect(portfolioAPI.getAssets).toHaveBeenCalled()
    expect(portfolioAPI.getTransactions).toHaveBeenCalled()
  })

  it('syncBrokers não recarrega dados quando a API recusa', async () => {
    portfolioAPI.syncBrokers.mockResolvedValue({
      data: { success: false, message: 'Sync indisponível' }
    })

    const result = await store.syncBrokers()

    expect(result.success).toBe(false)
    expect(result.error).toBe('Sync indisponível')
    expect(portfolioAPI.getSummary).not.toHaveBeenCalled()
  })
})
