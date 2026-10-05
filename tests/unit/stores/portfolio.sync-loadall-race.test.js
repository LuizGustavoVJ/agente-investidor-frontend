import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const portfolioAPI = vi.hoisted(() => ({
  syncBrokers: vi.fn(),
  getSummary: vi.fn(),
  getAllocation: vi.fn(),
  getAssets: vi.fn(),
  getTransactions: vi.fn(),
  getGoals: vi.fn(),
  getEvolution: vi.fn(),
  getPerformance: vi.fn(),
  getRiskAnalysis: vi.fn()
}))

vi.mock('@/api/portfolio', () => ({ portfolioAPI }))

import { usePortfolioStore } from '@/stores/portfolio'

const ok = (data) => Promise.resolve({ data: { success: true, data } })

describe('portfolio — loadAllData em paralelo com syncBrokers sobrescreve o pós-sync', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()

    portfolioAPI.getAllocation.mockImplementation(() => ok({ byType: {} }))
    portfolioAPI.getAssets.mockImplementation(() => ok([]))
    portfolioAPI.getTransactions.mockImplementation(() => ok([]))
    portfolioAPI.getGoals.mockImplementation(() => ok([]))
    portfolioAPI.getEvolution.mockImplementation(() => ok([]))
    portfolioAPI.getPerformance.mockImplementation(() => ok({}))
    portfolioAPI.getRiskAnalysis.mockImplementation(() => ok({}))
  })

  it('GET de resumo pré-sync que chega por último zera o patrimônio pós-sync', async () => {
    let syncPosted = false
    const pendingSummaries = []

    portfolioAPI.syncBrokers.mockImplementation(() =>
      Promise.resolve({ data: { success: true, data: { synced: 1 } } }).then((response) => {
        syncPosted = true
        return response
      })
    )

    portfolioAPI.getSummary.mockImplementation(() => {
      const afterSync = syncPosted
      return new Promise((resolve) => {
        pendingSummaries.push({ afterSync, resolve })
      })
    })

    const race = Promise.all([store.syncBrokers(), store.loadAllData()])

    for (let i = 0; i < 30 && pendingSummaries.length < 2; i += 1) {
      await Promise.resolve()
    }

    expect(pendingSummaries).toHaveLength(2)

    const preSync = pendingSummaries.find((item) => !item.afterSync)
    const postSync = pendingSummaries.find((item) => item.afterSync)

    expect(preSync).toBeDefined()
    expect(postSync).toBeDefined()

    postSync.resolve({
      data: { success: true, data: { totalValue: 99999, totalGain: 5000 } }
    })
    for (let i = 0; i < 10; i += 1) {
      await Promise.resolve()
    }

    expect(store.summary.totalValue).toBe(99999)

    preSync.resolve({
      data: { success: true, data: { totalValue: 10000, totalGain: 0 } }
    })
    await race

    expect(store.summary.totalValue).toBe(10000)
    expect(store.totalValue).toBe(10000)
  })

  it('Dashboard dispara as duas actions na mesma Promise.all — a ordem do GET não é garantida', async () => {
    const callOrder = []

    portfolioAPI.syncBrokers.mockImplementation(() => {
      callOrder.push('sync-post')
      return ok({ synced: 1 })
    })
    portfolioAPI.getSummary.mockImplementation(() => {
      callOrder.push('get-summary')
      return ok({ totalValue: 1 })
    })

    await Promise.all([store.syncBrokers(), store.loadAllData()])

    expect(callOrder.filter((item) => item === 'get-summary').length).toBe(2)
    expect(callOrder[0]).toBe('sync-post')
  })
})
