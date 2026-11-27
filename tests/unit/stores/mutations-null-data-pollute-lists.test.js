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

describe('Stores: success + data:null polui listas e quebra getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('createGoal com data:null faz push de null e activeGoals lança', async () => {
    const store = usePortfolioStore()
    store.goals = [{ id: 1, status: 'active', targetValue: 10000 }]
    portfolioAPI.createGoal.mockResolvedValue(ok(null))

    const result = await store.createGoal({ title: 'Reserva', targetValue: 5000 })

    expect(result.success).toBe(true)
    expect(store.goals).toHaveLength(2)
    expect(store.goals[1]).toBeNull()
    expect(() => store.activeGoals).toThrow()
  })

  it('updateGoal com data:null substitui a meta existente por null', async () => {
    const store = usePortfolioStore()
    store.goals = [{ id: 7, status: 'active', targetValue: 20000, currentValue: 1000 }]
    portfolioAPI.updateGoal.mockResolvedValue(ok(null))

    const result = await store.updateGoal(7, { targetValue: 25000 })

    expect(result.success).toBe(true)
    expect(store.goals[0]).toBeNull()
    expect(() => store.activeGoals).toThrow()
  })

  it('connectBroker com data:null faz push de null e activeBrokers lança', async () => {
    const store = useBrokersStore()
    store.connectedBrokers = [{ connectionId: 'xp-1', status: 'active' }]
    brokersAPI.connectBroker.mockResolvedValue(ok(null))

    const result = await store.connectBroker({
      brokerId: 'clear',
      credentials: { token: 'x' },
      accountType: 'pf'
    })

    expect(result.success).toBe(true)
    expect(store.connectedBrokers).toHaveLength(2)
    expect(store.connectedBrokers[1]).toBeNull()
    expect(() => store.activeBrokers).toThrow()
    expect(() => store.totalConnectedBrokers).not.toThrow()
    expect(store.totalConnectedBrokers).toBe(2)
  })

  it('saveAnalysis com data:null empurra null em savedAnalyses', async () => {
    const store = useAnalysisStore()
    store.savedAnalyses = [{ id: 'keep' }]
    analysisAPI.saveAnalysis.mockResolvedValue(ok(null))

    const result = await store.saveAnalysis({ title: 'PETR4 value' })

    expect(result.success).toBe(true)
    expect(store.savedAnalyses).toEqual([{ id: 'keep' }, null])
  })

  it('testConnection success com data:null vira falha com TypeError e não grava lastTest', async () => {
    const store = useBrokersStore()
    store.connectedBrokers = [{ connectionId: 'xp-1', status: 'connected' }]
    brokersAPI.testConnection.mockResolvedValue(ok(null))

    const result = await store.testConnection('xp-1')

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/status/i)
    expect(store.connectedBrokers[0].lastTest).toBeUndefined()
    expect(store.connectedBrokers[0].connectionStatus).toBeUndefined()
  })

  it('fetchSyncStatus() com data:null faz isSyncing lançar', async () => {
    const store = useBrokersStore()
    store.syncStatus = { 'xp-1': { isRunning: true } }
    brokersAPI.getSyncStatus.mockResolvedValue(ok(null))

    const result = await store.fetchSyncStatus()

    expect(result.success).toBe(true)
    expect(store.syncStatus).toBeNull()
    expect(() => store.isSyncing).toThrow()
  })
})
