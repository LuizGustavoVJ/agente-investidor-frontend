import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    connectBroker: vi.fn()
  }
}))

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    createGoal: vi.fn()
  }
}))

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    saveAnalysis: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'
import { useBrokersStore } from '@/stores/brokers'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'

const ok = (data) => ({ data: { success: true, data } })

describe('Stores — success com data null faz push de null e derruba getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('connectBroker com data null insere null e activeBrokers lança TypeError', async () => {
    brokersAPI.connectBroker.mockResolvedValue(ok(null))
    const store = useBrokersStore()

    const result = await store.connectBroker({ brokerId: 'xp', credentials: {} })

    expect(result.success).toBe(true)
    expect(store.connectedBrokers).toContain(null)
    expect(() => store.activeBrokers).toThrow(TypeError)
  })

  it('createGoal com data null insere null e activeGoals lança TypeError', async () => {
    portfolioAPI.createGoal.mockResolvedValue(ok(null))
    const store = usePortfolioStore()

    const result = await store.createGoal({ title: 'Reserva', targetValue: 10000 })

    expect(result.success).toBe(true)
    expect(store.goals).toContain(null)
    expect(() => store.activeGoals).toThrow(TypeError)
  })

  it('saveAnalysis com data null insere null na lista de análises salvas', async () => {
    analysisAPI.saveAnalysis.mockResolvedValue(ok(null))
    const store = useAnalysisStore()

    const result = await store.saveAnalysis({ name: 'Backtest' })

    expect(result.success).toBe(true)
    expect(store.savedAnalyses).toContain(null)
  })
})
