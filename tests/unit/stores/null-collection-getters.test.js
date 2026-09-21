import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getSyncStatus: vi.fn()
  }
}))

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getTransactions: vi.fn()
  }
}))

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getRecommendations: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getSavedAnalyses: vi.fn(),
    deleteSavedAnalysis: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'
import { useBrokersStore } from '@/stores/brokers'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'

const ok = (data) => ({ data: { success: true, data } })

describe('Stores — coleções null e status por conexão', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchSyncStatus(connectionId) com data null faz isSyncing lançar TypeError', async () => {
    brokersAPI.getSyncStatus.mockResolvedValue(ok(null))
    const store = useBrokersStore()
    store.syncStatus = { other: { isRunning: false } }

    const result = await store.fetchSyncStatus('conn-1')

    expect(result.success).toBe(true)
    expect(store.syncStatus['conn-1']).toBeNull()
    expect(() => store.isSyncing).toThrow(TypeError)
  })

  it('fetchTransactions com data null faz recentTransactions lançar TypeError', async () => {
    portfolioAPI.getTransactions.mockResolvedValue(ok(null))
    const store = usePortfolioStore()

    const result = await store.fetchTransactions()

    expect(result.success).toBe(true)
    expect(() => store.recentTransactions).toThrow(TypeError)
  })

  it('fetchRecommendations com data null faz recentRecommendations lançar TypeError', async () => {
    analysisAPI.getRecommendations.mockResolvedValue(ok(null))
    const store = useAnalysisStore()

    const result = await store.fetchRecommendations()

    expect(result.success).toBe(true)
    expect(() => store.recentRecommendations).toThrow(TypeError)
  })

  it('fetchAnalysisHistory com data null faz recentAnalyses lançar TypeError', async () => {
    analysisAPI.getAnalysisHistory.mockResolvedValue(ok(null))
    const store = useAnalysisStore()

    const result = await store.fetchAnalysisHistory()

    expect(result.success).toBe(true)
    expect(() => store.recentAnalyses).toThrow(TypeError)
  })

  it('fetchSavedAnalyses com data null grava null; deleteSavedAnalysis devolve falha ao filtrar', async () => {
    analysisAPI.getSavedAnalyses.mockResolvedValue(ok(null))
    analysisAPI.deleteSavedAnalysis.mockResolvedValue(ok({}))
    const store = useAnalysisStore()

    const fetched = await store.fetchSavedAnalyses()
    expect(fetched.success).toBe(true)
    expect(store.savedAnalyses).toBeNull()

    const deleted = await store.deleteSavedAnalysis(1)
    expect(deleted.success).toBe(false)
    expect(store.savedAnalyses).toBeNull()
  })
})
