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

const apiSuccess = (data) => ({ data: { success: true, data } })

describe('Portfolio Store — getters e CRUD de metas', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  describe('Getters financeiros', () => {
    it('usa zero quando o resumo ainda não foi carregado', () => {
      expect(store.totalValue).toBe(0)
      expect(store.totalGain).toBe(0)
      expect(store.totalGainPercent).toBe(0)
      expect(store.totalInvested).toBe(0)
      expect(store.assetsByType).toEqual({})
    })

    it('expõe totais a partir do summary', () => {
      store.summary = {
        totalValue: 120000,
        totalGain: 20000,
        totalGainPercent: 20,
        totalInvested: 100000
      }

      expect(store.totalValue).toBe(120000)
      expect(store.totalGain).toBe(20000)
      expect(store.totalGainPercent).toBe(20)
      expect(store.totalInvested).toBe(100000)
    })

    it('topAssets ordena por valor atual, limita a 10 e muta o array canônico', () => {
      store.assets = Array.from({ length: 12 }, (_, i) => ({
        symbol: `ATIVO${i}`,
        currentValue: i * 100
      }))

      expect(store.topAssets).toHaveLength(10)
      expect(store.topAssets[0].symbol).toBe('ATIVO11')
      expect(store.topAssets[9].symbol).toBe('ATIVO2')
      expect(store.assets[0].symbol).toBe('ATIVO11')
    })

    it('recentTransactions também ordena in-place o array da API', () => {
      store.transactions = [
        { id: 1, date: '2026-01-01' },
        { id: 2, date: '2026-03-10' },
        { id: 3, date: '2026-02-01' }
      ]

      expect(store.recentTransactions.map(t => t.id)).toEqual([2, 3, 1])
      expect(store.transactions[0].id).toBe(2)
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
    it('createGoal adiciona a meta retornada pela API', async () => {
      const goal = { id: 9, title: 'Reserva', status: 'active' }
      portfolioAPI.createGoal.mockResolvedValue(apiSuccess(goal))

      const result = await store.createGoal({ title: 'Reserva', targetValue: 10000 })

      expect(result).toEqual({ success: true, data: goal })
      expect(store.goals).toContainEqual(goal)
    })

    it('updateGoal substitui a meta existente', async () => {
      store.goals = [{ id: 9, title: 'Antiga' }, { id: 8, title: 'Outra' }]
      portfolioAPI.updateGoal.mockResolvedValue(apiSuccess({ id: 9, title: 'Nova' }))

      const result = await store.updateGoal(9, { title: 'Nova' })

      expect(result.success).toBe(true)
      expect(store.goals[0].title).toBe('Nova')
      expect(store.goals[1].title).toBe('Outra')
    })

    it('deleteGoal remove apenas a meta pedida', async () => {
      store.goals = [{ id: 9 }, { id: 8 }]
      portfolioAPI.deleteGoal.mockResolvedValue(apiSuccess({}))

      const result = await store.deleteGoal(9)

      expect(result.success).toBe(true)
      expect(store.goals).toEqual([{ id: 8 }])
    })

    it('não altera a lista quando a API recusa a exclusão', async () => {
      store.goals = [{ id: 9 }]
      portfolioAPI.deleteGoal.mockResolvedValue({
        data: { success: false, message: 'Meta vinculada a aportes' }
      })

      const result = await store.deleteGoal(9)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Meta vinculada a aportes')
      expect(store.goals).toEqual([{ id: 9 }])
    })
  })

  describe('fetchSummary', () => {
    it('grava resumo e lastUpdate em sucesso', async () => {
      portfolioAPI.getSummary.mockResolvedValue(apiSuccess({ totalValue: 10 }))

      const result = await store.fetchSummary()

      expect(result.success).toBe(true)
      expect(store.summary.totalValue).toBe(10)
      expect(store.lastUpdate).toBeInstanceOf(Date)
    })
  })
})
