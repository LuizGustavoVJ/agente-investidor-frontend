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

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getMarketAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn(),
    runAnalysis: vi.fn(),
    markAlertAsRead: vi.fn(),
    getAssetAnalysis: vi.fn(),
    saveAnalysis: vi.fn(),
    deleteSavedAnalysis: vi.fn(),
    compareAssets: vi.fn(),
    getPortfolioOptimization: vi.fn()
  }
}))

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncHistory: vi.fn(),
    resolveDataConflict: vi.fn(),
    updateCredentials: vi.fn()
  }
}))

import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'
import { brokersAPI } from '@/api/brokers'

const ok = (data) => ({ data: { success: true, data } })

describe('Stores: sync de sucesso deixa posições stale e fetches null quebram telas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('syncBroker success não atualiza saldo/posições da corretora conectada', async () => {
    const store = useBrokersStore()
    const broker = {
      connectionId: 'xp-1',
      name: 'XP',
      status: 'connected',
      balance: 15000.5,
      positions: [{ symbol: 'PETR4', quantity: 100 }]
    }
    store.connectedBrokers = [broker]
    brokersAPI.syncBroker.mockResolvedValue(
      ok({
        balance: 48000.12,
        positions: [{ symbol: 'PETR4', quantity: 250 }, { symbol: 'VALE3', quantity: 40 }]
      })
    )

    const result = await store.syncBroker('xp-1')

    expect(result.success).toBe(true)
    expect(brokersAPI.getConnectedBrokers).not.toHaveBeenCalled()
    expect(store.connectedBrokers[0].balance).toBe(15000.5)
    expect(store.connectedBrokers[0].positions).toEqual([{ symbol: 'PETR4', quantity: 100 }])
    expect(store.syncStatus['xp-1'].status).toBe('success')
    expect(store.syncStatus['xp-1'].isRunning).toBe(false)
  })

  it('fetchEvolution success com data:null deixa evolution nulo para o Dashboard mapear', async () => {
    const store = usePortfolioStore()
    store.evolution = [{ date: '2026-01-01', value: 100000 }]
    portfolioAPI.getEvolution.mockResolvedValue(ok(null))

    const result = await store.fetchEvolution('1Y')

    expect(result.success).toBe(true)
    expect(store.evolution).toBeNull()
  })

  it('fetchAnalysisHistory success com data:null faz recentAnalyses lançar', async () => {
    const store = useAnalysisStore()
    analysisAPI.getAnalysisHistory.mockResolvedValue(ok(null))

    const result = await store.fetchAnalysisHistory()

    expect(result.success).toBe(true)
    expect(store.analysisHistory).toBeNull()
    expect(() => store.recentAnalyses).toThrow()
  })

  it('fetchAvailableBrokers success com data:null deixa a lista nula', async () => {
    const store = useBrokersStore()
    store.availableBrokers = [{ id: 'xp', name: 'XP' }]
    brokersAPI.getAvailableBrokers.mockResolvedValue(ok(null))

    const result = await store.fetchAvailableBrokers()

    expect(result.success).toBe(true)
    expect(store.availableBrokers).toBeNull()
  })

  it('fetchPerformance e fetchRiskAnalysis com data:null apagam o snapshot anterior', async () => {
    const store = usePortfolioStore()
    store.performance = { return: 0.12 }
    store.riskAnalysis = { var: 0.04 }
    portfolioAPI.getPerformance.mockResolvedValue(ok(null))
    portfolioAPI.getRiskAnalysis.mockResolvedValue(ok(null))

    await store.fetchPerformance('1Y')
    await store.fetchRiskAnalysis()

    expect(store.performance).toBeNull()
    expect(store.riskAnalysis).toBeNull()
  })
})
