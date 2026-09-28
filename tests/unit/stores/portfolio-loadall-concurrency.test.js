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

const reject = (message) => Promise.reject(new Error(message))

function deferred() {
  let resolve
  let rejectFn
  const promise = new Promise((res, rej) => {
    resolve = res
    rejectFn = rej
  })
  return { promise, resolve, reject: rejectFn }
}

describe('Portfolio Store — loadAllData mascara falha e solta o spinner cedo', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  it('devolve success:true mesmo quando todas as buscas falham', async () => {
    portfolioAPI.getSummary.mockImplementation(() => reject('resumo'))
    portfolioAPI.getAllocation.mockImplementation(() => reject('alocação'))
    portfolioAPI.getEvolution.mockImplementation(() => reject('evolução'))
    portfolioAPI.getAssets.mockImplementation(() => reject('ativos'))
    portfolioAPI.getTransactions.mockImplementation(() => reject('transações'))
    portfolioAPI.getGoals.mockImplementation(() => reject('metas'))
    portfolioAPI.getPerformance.mockImplementation(() => reject('performance'))

    const result = await store.loadAllData()

    expect(result.success).toBe(true)
    expect(store.summary).toBeNull()
    expect(store.allocation).toBeNull()
    expect(store.evolution).toBeNull()
    expect(store.assets).toEqual([])
    expect(store.goals).toEqual([])
    expect(store.performance).toBeNull()
    expect(store.totalValue).toBe(0)
  })

  it('fetchSummary no finally zera isLoading enquanto as outras buscas ainda estão pendentes', async () => {
    const summary = deferred()
    const allocation = deferred()
    const evolution = deferred()
    const assets = deferred()
    const transactions = deferred()
    const goals = deferred()
    const performance = deferred()

    portfolioAPI.getSummary.mockReturnValue(summary.promise)
    portfolioAPI.getAllocation.mockReturnValue(allocation.promise)
    portfolioAPI.getEvolution.mockReturnValue(evolution.promise)
    portfolioAPI.getAssets.mockReturnValue(assets.promise)
    portfolioAPI.getTransactions.mockReturnValue(transactions.promise)
    portfolioAPI.getGoals.mockReturnValue(goals.promise)
    portfolioAPI.getPerformance.mockReturnValue(performance.promise)

    const loadPromise = store.loadAllData()
    await Promise.resolve()

    expect(store.isLoading).toBe(true)

    summary.resolve({ data: { success: true, data: { totalValue: 50000 } } })
    await vi.waitFor(() => {
      expect(store.summary).toEqual({ totalValue: 50000 })
    })

    expect(store.allocation).toBeNull()
    expect(store.isLoading).toBe(false)

    allocation.resolve({ data: { success: true, data: { byType: { stocks: { percentage: 100 } } } } })
    evolution.resolve({ data: { success: true, data: [] } })
    assets.resolve({ data: { success: true, data: [] } })
    transactions.resolve({ data: { success: true, data: [] } })
    goals.resolve({ data: { success: true, data: [] } })
    performance.resolve({ data: { success: true, data: { ytd: 0 } } })

    const result = await loadPromise
    expect(result.success).toBe(true)
    expect(store.allocation).toEqual({ byType: { stocks: { percentage: 100 } } })
  })
})
