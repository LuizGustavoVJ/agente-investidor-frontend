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
    getDividends: vi.fn(),
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
    runAnalysis: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    markAlertAsRead: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getAssetAnalysis: vi.fn(),
    getMarketAnalysis: vi.fn(),
    saveAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn(),
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
    getSyncHistory: vi.fn()
  }
}))

import { authAPI } from '@/api/auth'
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'
import { brokersAPI } from '@/api/brokers'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'

const ok = (data = {}) => ({ data: { success: true, data } })

describe('Stores: dados omitidos, identidade e sessão', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  describe('portfolio: loadAllData incompleto', () => {
    it('não busca dividendos nem análise de risco no loadAllData', async () => {
      const store = usePortfolioStore()
      for (const fn of [
        portfolioAPI.getSummary,
        portfolioAPI.getAllocation,
        portfolioAPI.getEvolution,
        portfolioAPI.getAssets,
        portfolioAPI.getTransactions,
        portfolioAPI.getGoals,
        portfolioAPI.getPerformance
      ]) {
        fn.mockResolvedValue(ok([]))
      }
      portfolioAPI.getSummary.mockResolvedValue({ data: { success: true, data: { totalValue: 1 } } })

      await store.loadAllData()

      expect(portfolioAPI.getDividends).not.toHaveBeenCalled()
      expect(portfolioAPI.getRiskAnalysis).not.toHaveBeenCalled()
      expect(store.dividends).toEqual([])
      expect(store.riskAnalysis).toBeNull()
    })

    it('recentTransactions ordena o array original in-place', () => {
      const store = usePortfolioStore()
      store.transactions = [
        { id: 1, date: '2024-01-01' },
        { id: 2, date: '2024-06-01' }
      ]

      const recent = store.recentTransactions

      expect(recent).not.toBe(store.transactions)
      expect(store.transactions.map(t => t.id)).toEqual([2, 1])
      expect(() => {
        store.transactions = [{ id: 3, date: 'not-a-date' }, { id: 4, date: '2024-01-01' }]
        return store.recentTransactions
      }).not.toThrow()
    })

    it('updateGoal com id não encontrado ainda retorna sucesso sem alterar o array', async () => {
      const store = usePortfolioStore()
      store.goals = [{ id: 1, title: 'Casa' }]
      portfolioAPI.updateGoal.mockResolvedValue({
        data: { success: true, data: { id: '1', title: 'Atualizada' } }
      })

      const result = await store.updateGoal('1', { title: 'Atualizada' })

      expect(result.success).toBe(true)
      expect(store.goals[0].title).toBe('Casa')
    })

    it('createGoal sem status na resposta não entra em activeGoals', async () => {
      const store = usePortfolioStore()
      portfolioAPI.createGoal.mockResolvedValue({
        data: { success: true, data: { id: 9, title: 'Nova' } }
      })

      await store.createGoal({ title: 'Nova' })

      expect(store.goals).toHaveLength(1)
      expect(store.activeGoals).toEqual([])
    })
  })

  describe('analysis: resultado não persistido', () => {
    it('fetchAssetAnalysis devolve dados mas não grava em currentAnalysis', async () => {
      const store = useAnalysisStore()
      analysisAPI.getAssetAnalysis.mockResolvedValue({
        data: { success: true, data: { symbol: 'PETR4', score: 81 } }
      })

      const result = await store.fetchAssetAnalysis('PETR4', ['value'])

      expect(result.success).toBe(true)
      expect(result.data.score).toBe(81)
      expect(store.currentAnalysis).toBeNull()
    })

    it('runAnalysis grava currentAnalysis mas o histórico só copia id/parâmetros', async () => {
      const store = useAnalysisStore()
      analysisAPI.runAnalysis.mockResolvedValue({
        data: { success: true, data: { id: 42, score: 90, recommendation: 'buy' } }
      })

      await store.runAnalysis(7, { pe: 10 })

      expect(store.currentAnalysis.recommendation).toBe('buy')
      expect(store.analysisHistory[0]).toEqual(
        expect.objectContaining({
          id: 42,
          methodologyId: 7,
          parameters: { pe: 10 },
          status: 'completed'
        })
      )
      expect(store.analysisHistory[0]).not.toHaveProperty('score')
      expect(store.analysisHistory[0]).not.toHaveProperty('recommendation')
    })

    it('activeAlerts exige isRead=false E status=active', () => {
      const store = useAnalysisStore()
      store.alerts = [
        { id: 1, isRead: false, status: 'active', priority: 'critical' },
        { id: 2, isRead: false, status: 'pending', priority: 'critical' },
        { id: 3, isRead: true, status: 'active', priority: 'critical' },
        { id: 4, isRead: false, priority: 'critical' }
      ]

      expect(store.activeAlerts.map(a => a.id)).toEqual([1])
      expect(store.criticalAlerts.map(a => a.id)).toEqual([1])
    })
  })

  describe('brokers: histórico global e syncStatus', () => {
    it('fetchSyncHistory substitui o histórico inteiro mesmo filtrando por conexão', async () => {
      const store = useBrokersStore()
      store.syncHistory = [{ id: 'old', connectionId: 'a' }]
      brokersAPI.getSyncHistory.mockResolvedValue(ok([{ id: 'new', connectionId: 'b' }]))

      await store.fetchSyncHistory('b')

      expect(store.syncHistory).toEqual([{ id: 'new', connectionId: 'b' }])
      expect(store.syncHistory.some(e => e.connectionId === 'a')).toBe(false)
    })
  })

  describe('auth: login sem user, initialize e logout', () => {
    it('login com success e sem user autentica como false e grava JSON indefinido', async () => {
      const store = useAuthStore()
      authAPI.login.mockResolvedValue({ data: { success: true } })

      const result = await store.login({ email: 'a@b.com', password: 'secret' })

      expect(result.success).toBe(true)
      expect(store.user).toBeUndefined()
      expect(store.isAuthenticated).toBe(false)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('user', undefined)
    })

    it('initialize não revalida cookie se isInitialized já é true', async () => {
      const store = useAuthStore()
      store.isInitialized = true
      store.user = null

      await store.initialize()

      expect(authAPI.checkAuth).not.toHaveBeenCalled()
      expect(store.isAuthenticated).toBe(false)
    })

    it('logout em /cadastro redireciona para /login', async () => {
      const store = useAuthStore()
      authAPI.logout.mockResolvedValue({ data: { success: true } })
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: {
          href: 'http://localhost:3000/cadastro',
          pathname: '/cadastro',
          origin: 'http://localhost:3000',
          search: '',
          hash: '',
          reload: vi.fn(),
          assign: vi.fn()
        }
      })

      await store.logout()

      expect(window.location.href).toBe('/login')
    })
  })
})
