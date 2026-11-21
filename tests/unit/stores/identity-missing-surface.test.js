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
    syncBrokers: vi.fn(),
    addTransaction: vi.fn(),
    getRebalanceSuggestions: vi.fn(),
    applyRebalance: vi.fn(),
    getAssetDetails: vi.fn()
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
    getPortfolioOptimization: vi.fn(),
    getPortfolioAnalysis: vi.fn()
  }
}))

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    getSyncHistory: vi.fn(),
    resolveDataConflict: vi.fn()
  }
}))

import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'
import { brokersAPI } from '@/api/brokers'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'

const ok = (data = {}) => ({ data: { success: true, data } })

describe('Stores: identidade de IDs e superfície de API ausente', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('portfolio', () => {
    it('deleteGoal com id string vs número retorna sucesso e mantém a meta', async () => {
      const store = usePortfolioStore()
      store.goals = [{ id: 1, title: 'Casa' }]
      portfolioAPI.deleteGoal.mockResolvedValue({ data: { success: true } })

      const result = await store.deleteGoal('1')

      expect(result.success).toBe(true)
      expect(store.goals).toEqual([{ id: 1, title: 'Casa' }])
    })

    it('não expõe fetchDividends nem addTransaction apesar da API existir', () => {
      const store = usePortfolioStore()

      expect(store.fetchDividends).toBeUndefined()
      expect(store.addTransaction).toBeUndefined()
      expect(typeof portfolioAPI.getDividends).toBe('function')
      expect(typeof portfolioAPI.addTransaction).toBe('function')
    })

    it('syncBrokers recarrega resumo/ativos/transações mas não metas, dividendos nem risco', async () => {
      const store = usePortfolioStore()
      for (const fn of [
        portfolioAPI.syncBrokers,
        portfolioAPI.getSummary,
        portfolioAPI.getAllocation,
        portfolioAPI.getAssets,
        portfolioAPI.getTransactions
      ]) {
        fn.mockResolvedValue(ok({}))
      }

      await store.syncBrokers()

      expect(portfolioAPI.getSummary).toHaveBeenCalled()
      expect(portfolioAPI.getAllocation).toHaveBeenCalled()
      expect(portfolioAPI.getAssets).toHaveBeenCalled()
      expect(portfolioAPI.getTransactions).toHaveBeenCalled()
      expect(portfolioAPI.getGoals).not.toHaveBeenCalled()
      expect(portfolioAPI.getDividends).not.toHaveBeenCalled()
      expect(portfolioAPI.getRiskAnalysis).not.toHaveBeenCalled()
      expect(portfolioAPI.getPerformance).not.toHaveBeenCalled()
    })
  })

  describe('analysis', () => {
    it('markAlertAsRead com id misto marca sucesso sem alterar o alerta local', async () => {
      const store = useAnalysisStore()
      store.alerts = [{ id: 7, isRead: false, status: 'active' }]
      analysisAPI.markAlertAsRead.mockResolvedValue({ data: { success: true } })

      const result = await store.markAlertAsRead('7')

      expect(result.success).toBe(true)
      expect(store.alerts[0].isRead).toBe(false)
      expect(store.alerts[0].readAt).toBeUndefined()
    })

    it('deleteSavedAnalysis com id misto retorna sucesso e mantém a análise', async () => {
      const store = useAnalysisStore()
      store.savedAnalyses = [{ id: 3, name: 'Value' }]
      analysisAPI.deleteSavedAnalysis.mockResolvedValue({ data: { success: true } })

      const result = await store.deleteSavedAnalysis('3')

      expect(result.success).toBe(true)
      expect(store.savedAnalyses).toHaveLength(1)
    })

    it('loadAllData não chama getPortfolioAnalysis nem getAssetAnalysis', async () => {
      const store = useAnalysisStore()
      for (const fn of [
        analysisAPI.getMethodologies,
        analysisAPI.getRecommendations,
        analysisAPI.getAlerts,
        analysisAPI.getAnalysisHistory,
        analysisAPI.getMarketAnalysis,
        analysisAPI.getSavedAnalyses
      ]) {
        fn.mockResolvedValue(ok([]))
      }

      await store.loadAllData()

      expect(analysisAPI.getPortfolioAnalysis).not.toHaveBeenCalled()
      expect(analysisAPI.getAssetAnalysis).not.toHaveBeenCalled()
    })
  })

  describe('brokers', () => {
    it('disconnectBroker filtra connectionId e ignora broker.id', async () => {
      const store = useBrokersStore()
      store.connectedBrokers = [
        { id: 10, connectionId: 'xp-1', name: 'XP' }
      ]
      brokersAPI.disconnectBroker.mockResolvedValue({ data: { success: true } })

      const byId = await store.disconnectBroker(10)
      expect(byId.success).toBe(true)
      expect(store.connectedBrokers).toHaveLength(1)

      const byConnection = await store.disconnectBroker('xp-1')
      expect(byConnection.success).toBe(true)
      expect(store.connectedBrokers).toEqual([])
    })

    it('testConnection com id numérico não atualiza o broker identificado por connectionId', async () => {
      const store = useBrokersStore()
      store.connectedBrokers = [
        { id: 10, connectionId: 'xp-1', connectionStatus: 'unknown' }
      ]
      brokersAPI.testConnection.mockResolvedValue({
        data: { success: true, data: { status: 'ok' } }
      })

      await store.testConnection(10)

      expect(store.connectedBrokers[0].connectionStatus).toBe('unknown')
      expect(store.connectedBrokers[0].lastTest).toBeUndefined()
    })

    it('resolveConflict com id misto deixa o conflito na lista', async () => {
      const store = useBrokersStore()
      store.pendingConflicts = [{ id: 4, symbol: 'PETR4' }]
      brokersAPI.resolveDataConflict.mockResolvedValue({ data: { success: true } })

      const result = await store.resolveConflict('4', { keep: 'local' })

      expect(result.success).toBe(true)
      expect(store.pendingConflicts).toHaveLength(1)
    })

    it('loadAllData não busca histórico de sincronização', async () => {
      const store = useBrokersStore()
      brokersAPI.getAvailableBrokers.mockResolvedValue(ok([]))
      brokersAPI.getConnectedBrokers.mockResolvedValue(ok([]))
      brokersAPI.getSyncStatus.mockResolvedValue(ok({}))
      brokersAPI.getPendingConflicts.mockResolvedValue(ok([]))

      await store.loadAllData()

      expect(brokersAPI.getSyncHistory).not.toHaveBeenCalled()
      expect(store.syncHistory).toEqual([])
    })
  })

  describe('auth: ações que Configurações chama', () => {
    it('não exporta loadUserSettings, changePassword, deleteAccount nem updateInvestorProfile', () => {
      const store = useAuthStore()

      expect(store.loadUserSettings).toBeUndefined()
      expect(store.changePassword).toBeUndefined()
      expect(store.deleteAccount).toBeUndefined()
      expect(store.updateInvestorProfile).toBeUndefined()
      expect(store.updateNotificationSettings).toBeUndefined()
      expect(store.updatePrivacySettings).toBeUndefined()
      expect(store.setup2FA).toBeUndefined()
      expect(store.activeSessions).toBeUndefined()
    })
  })
})
