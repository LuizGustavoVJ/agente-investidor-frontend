import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'
import { portfolioAPI } from '@/api/portfolio'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    syncBrokers: vi.fn(),
    getSummary: vi.fn(),
    getAllocation: vi.fn(),
    getAssets: vi.fn(),
    getTransactions: vi.fn()
  }
}))

describe('portfolio store — syncBrokers ignora falha das recargas', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna success mesmo quando fetchSummary falha após o POST de sync', async () => {
    store.summary = {
      totalValue: 100000,
      totalGain: 5000,
      totalGainPercent: 5,
      totalInvested: 95000
    }

    portfolioAPI.syncBrokers.mockResolvedValue({ data: { success: true } })
    portfolioAPI.getSummary.mockResolvedValue({
      data: { success: false, message: 'resumo indisponível' }
    })
    portfolioAPI.getAllocation.mockResolvedValue({
      data: { success: true, data: { byType: {} } }
    })
    portfolioAPI.getAssets.mockResolvedValue({ data: { success: true, data: [] } })
    portfolioAPI.getTransactions.mockResolvedValue({ data: { success: true, data: [] } })

    const result = await store.syncBrokers()

    expect(portfolioAPI.syncBrokers).toHaveBeenCalledTimes(1)
    expect(portfolioAPI.getSummary).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
    expect(store.summary.totalValue).toBe(100000)
  })

  it('Promise.all de recargas que devolvem { success: false } não rejeita', async () => {
    portfolioAPI.syncBrokers.mockResolvedValue({ data: { success: true } })
    portfolioAPI.getSummary.mockResolvedValue({ data: { success: false } })
    portfolioAPI.getAllocation.mockResolvedValue({ data: { success: false } })
    portfolioAPI.getAssets.mockResolvedValue({ data: { success: false } })
    portfolioAPI.getTransactions.mockResolvedValue({ data: { success: false } })

    const result = await store.syncBrokers()

    expect(result).toEqual({ success: true })
    expect(store.error).toBeTruthy()
  })
})
