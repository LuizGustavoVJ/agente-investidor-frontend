import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getSyncStatus: vi.fn(),
    getConnectedBrokers: vi.fn()
  }
}))

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getAlerts: vi.fn(),
    getMethodologies: vi.fn()
  }
}))

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getGoals: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'
import { analysisAPI } from '@/api/analysis'
import { portfolioAPI } from '@/api/portfolio'
import { useBrokersStore } from '@/stores/brokers'
import { useAnalysisStore } from '@/stores/analysis'
import { usePortfolioStore } from '@/stores/portfolio'

const ok = (data) => ({ data: { success: true, data } })

describe('Stores — payload success com data null derruba getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchSyncStatus com data null faz isSyncing lançar TypeError', async () => {
    brokersAPI.getSyncStatus.mockResolvedValue(ok(null))
    const store = useBrokersStore()

    const result = await store.fetchSyncStatus()

    expect(result.success).toBe(true)
    expect(store.syncStatus).toBeNull()
    expect(() => store.isSyncing).toThrow(TypeError)
  })

  it('fetchConnectedBrokers com data null faz activeBrokers lançar TypeError', async () => {
    brokersAPI.getConnectedBrokers.mockResolvedValue(ok(null))
    const store = useBrokersStore()

    const result = await store.fetchConnectedBrokers()

    expect(result.success).toBe(true)
    expect(() => store.activeBrokers).toThrow(TypeError)
  })

  it('fetchAlerts com data null faz activeAlerts lançar TypeError', async () => {
    analysisAPI.getAlerts.mockResolvedValue(ok(null))
    const store = useAnalysisStore()

    const result = await store.fetchAlerts()

    expect(result.success).toBe(true)
    expect(() => store.activeAlerts).toThrow(TypeError)
  })

  it('fetchMethodologies com data null faz methodologiesByCategory lançar TypeError', async () => {
    analysisAPI.getMethodologies.mockResolvedValue(ok(null))
    const store = useAnalysisStore()

    const result = await store.fetchMethodologies()

    expect(result.success).toBe(true)
    expect(() => store.methodologiesByCategory).toThrow(TypeError)
  })

  it('fetchGoals com data null faz activeGoals lançar TypeError', async () => {
    portfolioAPI.getGoals.mockResolvedValue(ok(null))
    const store = usePortfolioStore()

    const result = await store.fetchGoals()

    expect(result.success).toBe(true)
    expect(() => store.activeGoals).toThrow(TypeError)
  })
})
