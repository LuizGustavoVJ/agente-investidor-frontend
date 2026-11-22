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
    syncBrokers: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn()
  }
}))

import { usePortfolioStore } from '@/stores/portfolio'
import { portfolioAPI } from '@/api/portfolio'

const fail = (message) => ({ data: { success: false, message } })
const ok = (data) => ({ data: { success: true, data } })

describe('Portfolio: loadAllData agrega sucesso e getters tratam ausência como zero', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  it('loadAllData devolve success:true mesmo quando todas as buscas filhas falham', async () => {
    portfolioAPI.getSummary.mockResolvedValue(fail('resumo'))
    portfolioAPI.getAllocation.mockResolvedValue(fail('alocação'))
    portfolioAPI.getEvolution.mockResolvedValue(fail('evolução'))
    portfolioAPI.getAssets.mockResolvedValue(fail('ativos'))
    portfolioAPI.getTransactions.mockResolvedValue(fail('transações'))
    portfolioAPI.getGoals.mockResolvedValue(fail('metas'))
    portfolioAPI.getPerformance.mockResolvedValue(fail('performance'))

    const result = await store.loadAllData()

    expect(result.success).toBe(true)
    expect(store.summary).toBeNull()
    expect(store.assets).toEqual([])
    expect(store.goals).toEqual([])
  })

  it('totalValue/totalGain/totalInvested viram 0 quando summary é null — igual a carteira vazia', () => {
    expect(store.summary).toBeNull()
    expect(store.totalValue).toBe(0)
    expect(store.totalGain).toBe(0)
    expect(store.totalGainPercent).toBe(0)
    expect(store.totalInvested).toBe(0)
  })

  it('totalValue || 0 também esconde totalValue real 0 vs carga falha — ambos leem como 0', async () => {
    portfolioAPI.getSummary.mockResolvedValue(ok({ totalValue: 0, totalGain: 0, totalGainPercent: 0, totalInvested: 0 }))
    await store.fetchSummary()

    expect(store.summary).toEqual({
      totalValue: 0,
      totalGain: 0,
      totalGainPercent: 0,
      totalInvested: 0
    })
    expect(store.totalValue).toBe(0)
    expect(store.totalGain).toBe(0)
  })

  it('fetchAllocation com sucesso não limpa error deixado por uma falha anterior', async () => {
    portfolioAPI.getAllocation
      .mockResolvedValueOnce(fail('Erro ao carregar alocação'))
      .mockResolvedValueOnce(ok({ byType: { stocks: { percentage: 100 } } }))

    await store.fetchAllocation()
    expect(store.error).toBe('Erro ao carregar alocação')

    const result = await store.fetchAllocation()
    expect(result.success).toBe(true)
    expect(store.allocation).toEqual({ byType: { stocks: { percentage: 100 } } })
    expect(store.error).toBe('Erro ao carregar alocação')
  })
})
