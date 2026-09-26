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
    syncBrokers: vi.fn()
  }
}))

import { portfolioAPI } from '@/api/portfolio'
import { usePortfolioStore } from '@/stores/portfolio'

describe('Portfolio — summary nulo e totais string', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  it('success com data: null zera o patrimônio sem marcar erro', async () => {
    store.summary = { totalValue: 150000, totalGain: 12000 }
    portfolioAPI.getSummary.mockResolvedValue({
      data: { success: true, data: null }
    })

    const result = await store.fetchSummary()

    expect(result).toEqual({ success: true })
    expect(store.summary).toBeNull()
    expect(store.totalValue).toBe(0)
    expect(store.totalGain).toBe(0)
    expect(store.error).toBeNull()
  })

  it('totais string passam no getter e não viram número', () => {
    store.summary = {
      totalValue: '1000',
      totalGain: '50',
      totalGainPercent: '5',
      totalInvested: '950'
    }

    expect(store.totalValue).toBe('1000')
    expect(store.totalGain).toBe('50')
    expect(store.totalValue + store.totalGain).toBe('100050')
  })
})
