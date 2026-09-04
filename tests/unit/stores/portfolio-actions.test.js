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

import { portfolioAPI } from '@/api/portfolio'
import { usePortfolioStore } from '@/stores/portfolio'

const success = (data) => ({ data: { success: true, data } })
const apiError = (message) => {
  const error = new Error(message)
  error.response = { data: { message } }
  return error
}

describe('Portfolio Store — fetch, sync e limpeza', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  describe('Carregamento de dados', () => {
    it('preenche allocation, evolution, assets, transactions, performance e risco', async () => {
      portfolioAPI.getAllocation.mockResolvedValue(success({ byType: { acoes: 70 } }))
      portfolioAPI.getEvolution.mockResolvedValue(success({ points: [1, 2] }))
      portfolioAPI.getAssets.mockResolvedValue(success([{ symbol: 'PETR4' }]))
      portfolioAPI.getTransactions.mockResolvedValue(success([{ id: 1 }]))
      portfolioAPI.getPerformance.mockResolvedValue(success({ ytd: 12 }))
      portfolioAPI.getRiskAnalysis.mockResolvedValue(success({ volatility: 18 }))

      await store.fetchAllocation()
      await store.fetchEvolution('6M')
      await store.fetchAssets({ type: 'stock' })
      await store.fetchTransactions({ from: '2026-01-01' })
      await store.fetchPerformance('6M')
      await store.fetchRiskAnalysis()

      expect(portfolioAPI.getEvolution).toHaveBeenCalledWith('6M')
      expect(portfolioAPI.getAssets).toHaveBeenCalledWith({ type: 'stock' })
      expect(store.allocation).toEqual({ byType: { acoes: 70 } })
      expect(store.evolution).toEqual({ points: [1, 2] })
      expect(store.assets).toEqual([{ symbol: 'PETR4' }])
      expect(store.transactions).toEqual([{ id: 1 }])
      expect(store.performance).toEqual({ ytd: 12 })
      expect(store.riskAnalysis).toEqual({ volatility: 18 })
    })

    it('propaga mensagem da API quando fetchAssets falha e não altera a lista', async () => {
      store.assets = [{ symbol: 'VALE3' }]
      portfolioAPI.getAssets.mockRejectedValue(apiError('Filtro inválido'))

      const result = await store.fetchAssets()

      expect(result).toEqual({ success: false, error: 'Filtro inválido' })
      expect(store.assets).toEqual([{ symbol: 'VALE3' }])
    })

    it('não substitui meta inexistente em updateGoal', async () => {
      store.goals = [{ id: 1, title: 'Original' }]
      portfolioAPI.updateGoal.mockResolvedValue(success({ id: 99, title: 'Nova' }))

      const result = await store.updateGoal(99, { title: 'Nova' })

      expect(result.success).toBe(true)
      expect(store.goals).toEqual([{ id: 1, title: 'Original' }])
    })
  })

  describe('syncBrokers', () => {
    it('recarrega resumo, alocação, ativos e transações após sync bem-sucedida', async () => {
      portfolioAPI.syncBrokers.mockResolvedValue(success({ imported: 8 }))
      portfolioAPI.getSummary.mockResolvedValue(success({ totalValue: 120000 }))
      portfolioAPI.getAllocation.mockResolvedValue(success({ byType: { fiis: 30 } }))
      portfolioAPI.getAssets.mockResolvedValue(success([{ symbol: 'HGLG11' }]))
      portfolioAPI.getTransactions.mockResolvedValue(success([{ id: 9 }]))

      const result = await store.syncBrokers()

      expect(result.success).toBe(true)
      expect(portfolioAPI.syncBrokers).toHaveBeenCalledTimes(1)
      expect(store.summary.totalValue).toBe(120000)
      expect(store.allocation.byType.fiis).toBe(30)
      expect(store.assets).toEqual([{ symbol: 'HGLG11' }])
      expect(store.transactions).toEqual([{ id: 9 }])
      expect(store.isLoading).toBe(false)
    })

    it('não recarrega dados quando a sync falha', async () => {
      portfolioAPI.syncBrokers.mockRejectedValue(apiError('Corretora offline'))

      const result = await store.syncBrokers()

      expect(result).toEqual({ success: false, error: 'Corretora offline' })
      expect(portfolioAPI.getSummary).not.toHaveBeenCalled()
      expect(store.summary).toBeNull()
    })
  })

  describe('loadAllData e clearData', () => {
    it('carrega o conjunto principal em paralelo', async () => {
      portfolioAPI.getSummary.mockResolvedValue(success({ totalValue: 1 }))
      portfolioAPI.getAllocation.mockResolvedValue(success({ byType: {} }))
      portfolioAPI.getEvolution.mockResolvedValue(success({ points: [] }))
      portfolioAPI.getAssets.mockResolvedValue(success([]))
      portfolioAPI.getTransactions.mockResolvedValue(success([]))
      portfolioAPI.getGoals.mockResolvedValue(success([]))
      portfolioAPI.getPerformance.mockResolvedValue(success({}))

      const result = await store.loadAllData()

      expect(result.success).toBe(true)
      expect(portfolioAPI.getSummary).toHaveBeenCalled()
      expect(portfolioAPI.getGoals).toHaveBeenCalled()
      expect(store.summary.totalValue).toBe(1)
    })

    it('zera estado financeiro em clearData sem remover clearError', () => {
      store.summary = { totalValue: 10 }
      store.allocation = { byType: { acoes: 1 } }
      store.evolution = { points: [1] }
      store.assets = [{ symbol: 'PETR4' }]
      store.transactions = [{ id: 1 }]
      store.dividends = [{ id: 1 }]
      store.goals = [{ id: 1 }]
      store.performance = { ytd: 1 }
      store.riskAnalysis = { volatility: 1 }
      store.lastUpdate = new Date()
      store.error = 'falha'

      store.clearData()
      store.clearError()

      expect(store.summary).toBeNull()
      expect(store.assets).toEqual([])
      expect(store.goals).toEqual([])
      expect(store.transactions).toEqual([])
      expect(store.lastUpdate).toBeNull()
      expect(store.error).toBeNull()
    })
  })
})
