import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { portfolioAPI } = vi.hoisted(() => ({
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

vi.mock('@/api/portfolio', () => ({ portfolioAPI }))

import { usePortfolioStore } from '@/stores/portfolio'

describe('Portfolio store — getters e metas', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  describe('getters com dados ausentes', () => {
    it('totais viram 0 quando summary é nulo', () => {
      expect(store.totalValue).toBe(0)
      expect(store.totalGain).toBe(0)
      expect(store.totalGainPercent).toBe(0)
      expect(store.totalInvested).toBe(0)
      expect(store.assetsByType).toEqual({})
    })

    it('topAssets ordena in-place por currentValue', () => {
      store.assets = [
        { symbol: 'ITUB4', currentValue: 3000 },
        { symbol: 'VALE3', currentValue: 8000 },
        { symbol: 'PETR4', currentValue: 5000 }
      ]

      expect(store.topAssets.map((a) => a.symbol)).toEqual(['VALE3', 'PETR4', 'ITUB4'])
      expect(store.assets[0].symbol).toBe('VALE3')
    })

    it('separa metas ativas e concluídas sem misturar pausadas', () => {
      store.goals = [
        { id: 1, status: 'active' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'paused' }
      ]

      expect(store.activeGoals.map((g) => g.id)).toEqual([1])
      expect(store.completedGoals.map((g) => g.id)).toEqual([2])
    })
  })

  describe('metas', () => {
    it('createGoal anexa a meta retornada pela API', async () => {
      portfolioAPI.createGoal.mockResolvedValue({
        data: { success: true, data: { id: 99, title: 'Reserva', status: 'active' } }
      })

      const result = await store.createGoal({ title: 'Reserva', targetValue: 10000 })

      expect(result.success).toBe(true)
      expect(store.goals).toHaveLength(1)
      expect(store.goals[0].id).toBe(99)
    })

    it('updateGoal não substitui quando o id da lista é string e o argumento é número', async () => {
      store.goals = [{ id: '7', title: 'Antiga' }]
      portfolioAPI.updateGoal.mockResolvedValue({
        data: { success: true, data: { id: 7, title: 'Nova' } }
      })

      const result = await store.updateGoal(7, { title: 'Nova' })

      expect(result.success).toBe(true)
      expect(store.goals[0].title).toBe('Antiga')
    })

    it('deleteGoal remove só o id com igualdade estrita', async () => {
      store.goals = [{ id: 7 }, { id: '7' }]
      portfolioAPI.deleteGoal.mockResolvedValue({ data: { success: true } })

      await store.deleteGoal(7)

      expect(store.goals).toEqual([{ id: '7' }])
    })
  })

  describe('syncBrokers', () => {
    it('recarrega resumo, alocação, ativos e transações após sync ok', async () => {
      portfolioAPI.syncBrokers.mockResolvedValue({ data: { success: true } })
      portfolioAPI.getSummary.mockResolvedValue({
        data: { success: true, data: { totalValue: 10 } }
      })
      portfolioAPI.getAllocation.mockResolvedValue({
        data: { success: true, data: { byType: { acao: 1 } } }
      })
      portfolioAPI.getAssets.mockResolvedValue({
        data: { success: true, data: [{ symbol: 'PETR4', currentValue: 1 }] }
      })
      portfolioAPI.getTransactions.mockResolvedValue({
        data: { success: true, data: [] }
      })

      const result = await store.syncBrokers()

      expect(result.success).toBe(true)
      expect(store.summary.totalValue).toBe(10)
      expect(store.allocation.byType.acao).toBe(1)
      expect(portfolioAPI.getEvolution).not.toHaveBeenCalled()
      expect(portfolioAPI.getGoals).not.toHaveBeenCalled()
    })

    it('não recarrega dados se o sync responder success false', async () => {
      portfolioAPI.syncBrokers.mockResolvedValue({
        data: { success: false, message: 'nenhuma corretora' }
      })

      const result = await store.syncBrokers()

      expect(result.success).toBe(false)
      expect(portfolioAPI.getSummary).not.toHaveBeenCalled()
      expect(store.error).toBe('nenhuma corretora')
    })
  })
})
