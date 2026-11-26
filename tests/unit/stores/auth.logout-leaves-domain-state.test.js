import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

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

import { authAPI } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'

describe('Auth: logout/login não limpam stores de domínio', () => {
  let authStore
  let portfolioStore
  let analysisStore
  let brokersStore

  const previousUserHoldings = {
    totalValue: 482350.77,
    totalGain: 19320.11
  }
  const previousAlerts = [
    { id: 'alert-pii', isRead: false, status: 'active', message: 'Stop loss PETR4' }
  ]
  const previousBrokers = [
    { connectionId: 'xp-1', name: 'XP', status: 'connected', accountInfo: '***123' }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
    brokersStore = useBrokersStore()
    vi.clearAllMocks()
    sessionStorage.setItem.mockClear()
    sessionStorage.removeItem.mockClear()

    authStore.user = { id: 1, name: 'Usuário A', email: 'a@invest.com' }
    portfolioStore.summary = { ...previousUserHoldings }
    analysisStore.alerts = previousAlerts
    brokersStore.connectedBrokers = previousBrokers
  })

  it('logout em rota pública limpa só o user — patrimônio, alertas e corretoras ficam na memória', async () => {
    authAPI.logout.mockResolvedValue({ data: { success: true } })

    await authStore.logout()

    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    expect(authStore.clearData).toBeUndefined()

    expect(portfolioStore.summary).toEqual(previousUserHoldings)
    expect(portfolioStore.totalValue).toBe(482350.77)
    expect(analysisStore.alerts).toEqual(previousAlerts)
    expect(brokersStore.connectedBrokers).toEqual(previousBrokers)
    expect(typeof portfolioStore.clearData).toBe('function')
    expect(typeof analysisStore.clearData).toBe('function')
    expect(typeof brokersStore.clearData).toBe('function')
  })

  it('login do usuário B não chama clearData — totalValue do usuário A permanece até um fetch sobrescrever', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: { id: 2, name: 'Usuário B', email: 'b@invest.com' } }
    })

    const result = await authStore.login({ email: 'b@invest.com', password: 'secret' })

    expect(result.success).toBe(true)
    expect(authStore.user.id).toBe(2)
    expect(portfolioStore.summary).toEqual(previousUserHoldings)
    expect(portfolioStore.totalValue).toBe(482350.77)
    expect(analysisStore.alerts[0].id).toBe('alert-pii')
    expect(brokersStore.connectedBrokers[0].connectionId).toBe('xp-1')
  })
})
