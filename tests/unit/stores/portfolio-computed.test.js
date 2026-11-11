import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'
import { portfolioAPI } from '@/api/portfolio'

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

describe('Portfolio store — getters e metas', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  describe('getters financeiros', () => {
    it('usa zero quando o resumo ainda não carregou', () => {
      expect(store.totalValue).toBe(0)
      expect(store.totalGain).toBe(0)
      expect(store.totalGainPercent).toBe(0)
      expect(store.totalInvested).toBe(0)
      expect(store.assetsByType).toEqual({})
    })

    it('lê totais do summary e alocação por tipo', () => {
      store.summary = {
        totalValue: 120000,
        totalGain: 20000,
        totalGainPercent: 20,
        totalInvested: 100000
      }
      store.allocation = { byType: { acao: 70, fii: 30 } }

      expect(store.totalValue).toBe(120000)
      expect(store.totalGain).toBe(20000)
      expect(store.totalGainPercent).toBe(20)
      expect(store.totalInvested).toBe(100000)
      expect(store.assetsByType).toEqual({ acao: 70, fii: 30 })
    })

    it('ordena topAssets pelos maiores currentValue e limita a 10', () => {
      store.assets = Array.from({ length: 12 }, (_, i) => ({
        symbol: `ATIVO${i}`,
        currentValue: i * 10
      }))

      const top = store.topAssets

      expect(top).toHaveLength(10)
      expect(top[0].symbol).toBe('ATIVO11')
      expect(top[9].symbol).toBe('ATIVO2')
    })

    it('ordena recentTransactions da mais nova para a mais antiga', () => {
      store.transactions = [
        { id: 1, date: '2024-01-01' },
        { id: 2, date: '2026-03-10' },
        { id: 3, date: '2025-12-01' }
      ]

      expect(store.recentTransactions.map(t => t.id)).toEqual([2, 3, 1])
    })

    it('separa metas ativas e concluídas', () => {
      store.goals = [
        { id: 1, status: 'active' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'paused' },
        { id: 4, status: 'active' }
      ]

      expect(store.activeGoals.map(g => g.id)).toEqual([1, 4])
      expect(store.completedGoals.map(g => g.id)).toEqual([2])
    })
  })

  describe('CRUD de metas', () => {
    it('adiciona meta criada na lista', async () => {
      const created = { id: 99, title: 'Reserva', status: 'active' }
      portfolioAPI.createGoal.mockResolvedValue({ data: { success: true, data: created } })

      const result = await store.createGoal({ title: 'Reserva', targetValue: 10000 })

      expect(result.success).toBe(true)
      expect(store.goals).toEqual([created])
    })

    it('substitui a meta pelo id na atualização', async () => {
      store.goals = [
        { id: 1, title: 'Antiga', targetValue: 10 },
        { id: 2, title: 'Outra', targetValue: 20 }
      ]
      portfolioAPI.updateGoal.mockResolvedValue({
        data: { success: true, data: { id: 1, title: 'Nova', targetValue: 50 } }
      })

      const result = await store.updateGoal(1, { title: 'Nova' })

      expect(result.success).toBe(true)
      expect(store.goals[0]).toEqual({ id: 1, title: 'Nova', targetValue: 50 })
      expect(store.goals[1].title).toBe('Outra')
    })

    it('não quebra se a meta atualizada não está no estado local', async () => {
      store.goals = [{ id: 2, title: 'Outra' }]
      portfolioAPI.updateGoal.mockResolvedValue({
        data: { success: true, data: { id: 1, title: 'Nova' } }
      })

      const result = await store.updateGoal(1, { title: 'Nova' })

      expect(result.success).toBe(true)
      expect(store.goals).toEqual([{ id: 2, title: 'Outra' }])
    })

    it('remove a meta deletada', async () => {
      store.goals = [{ id: 1 }, { id: 2 }]
      portfolioAPI.deleteGoal.mockResolvedValue({ data: { success: true } })

      const result = await store.deleteGoal(1)

      expect(result.success).toBe(true)
      expect(store.goals).toEqual([{ id: 2 }])
    })
  })

  describe('clearData', () => {
    it('zera dados financeiros incluindo dividendos e lastUpdate', () => {
      store.summary = { totalValue: 1 }
      store.allocation = { byType: {} }
      store.evolution = { points: [] }
      store.assets = [{ symbol: 'PETR4' }]
      store.transactions = [{ id: 1 }]
      store.dividends = [{ id: 1 }]
      store.goals = [{ id: 1 }]
      store.performance = { daily: 1 }
      store.riskAnalysis = { score: 1 }
      store.lastUpdate = new Date()

      store.clearData()

      expect(store.summary).toBeNull()
      expect(store.allocation).toBeNull()
      expect(store.evolution).toBeNull()
      expect(store.assets).toEqual([])
      expect(store.transactions).toEqual([])
      expect(store.dividends).toEqual([])
      expect(store.goals).toEqual([])
      expect(store.performance).toBeNull()
      expect(store.riskAnalysis).toBeNull()
      expect(store.lastUpdate).toBeNull()
    })
  })
})
