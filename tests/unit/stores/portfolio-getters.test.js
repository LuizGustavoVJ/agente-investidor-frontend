import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn(),
    getAllocation: vi.fn(),
    getAssets: vi.fn(),
    getTransactions: vi.fn(),
    getGoals: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn()
  }
}))

import { portfolioAPI } from '@/api/portfolio'
import { usePortfolioStore } from '@/stores/portfolio'

const success = (data) => ({ data: { success: true, data } })

describe('Portfolio Store — getters e metas', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePortfolioStore()
    vi.clearAllMocks()
  })

  describe('Getters', () => {
    it('usa zero como fallback quando o resumo ainda não carregou', () => {
      expect(store.totalValue).toBe(0)
      expect(store.totalGain).toBe(0)
      expect(store.totalGainPercent).toBe(0)
      expect(store.totalInvested).toBe(0)
    })

    it('lê totais a partir do summary', () => {
      store.summary = {
        totalValue: 100000,
        totalGain: 15000,
        totalGainPercent: 17.6,
        totalInvested: 85000
      }

      expect(store.totalValue).toBe(100000)
      expect(store.totalGain).toBe(15000)
      expect(store.totalGainPercent).toBe(17.6)
      expect(store.totalInvested).toBe(85000)
    })

    it('ordena topAssets por valor atual e limita a 10', () => {
      store.assets = Array.from({ length: 12 }, (_, i) => ({
        symbol: `A${i}`,
        currentValue: i * 10
      }))

      expect(store.topAssets).toHaveLength(10)
      expect(store.topAssets[0].symbol).toBe('A11')
      expect(store.topAssets[9].symbol).toBe('A2')
    })

    it('ordena transações recentes da mais nova para a mais antiga', () => {
      store.transactions = [
        { id: 1, date: '2026-01-01' },
        { id: 2, date: '2026-08-01' },
        { id: 3, date: '2026-03-15' }
      ]

      expect(store.recentTransactions.map((t) => t.id)).toEqual([2, 3, 1])
    })

    it('separa metas ativas e concluídas', () => {
      store.goals = [
        { id: 1, status: 'active' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'paused' },
        { id: 4, status: 'active' }
      ]

      expect(store.activeGoals.map((g) => g.id)).toEqual([1, 4])
      expect(store.completedGoals.map((g) => g.id)).toEqual([2])
    })

    it('retorna alocação vazia quando allocation é null', () => {
      expect(store.assetsByType).toEqual({})

      store.allocation = { byType: { renda_variavel: 70 } }
      expect(store.assetsByType).toEqual({ renda_variavel: 70 })
    })
  })

  describe('Metas', () => {
    it('carrega metas da API', async () => {
      const goals = [{ id: 1, status: 'active', targetValue: 10000 }]
      portfolioAPI.getGoals.mockResolvedValue(success(goals))

      const result = await store.fetchGoals()

      expect(result.success).toBe(true)
      expect(store.goals).toEqual(goals)
    })

    it('adiciona meta criada à lista', async () => {
      const created = { id: 9, title: 'Reserva', status: 'active' }
      portfolioAPI.createGoal.mockResolvedValue(success(created))

      const result = await store.createGoal({ title: 'Reserva', targetValue: 20000 })

      expect(result.success).toBe(true)
      expect(store.goals).toEqual([created])
      expect(store.isLoading).toBe(false)
    })

    it('substitui meta atualizada pelo payload da API', async () => {
      store.goals = [{ id: 1, title: 'Antiga', status: 'active' }]
      portfolioAPI.updateGoal.mockResolvedValue(
        success({ id: 1, title: 'Nova', status: 'active' })
      )

      await store.updateGoal(1, { title: 'Nova' })

      expect(store.goals[0].title).toBe('Nova')
    })

    it('remove meta deletada', async () => {
      store.goals = [{ id: 1 }, { id: 2 }]
      portfolioAPI.deleteGoal.mockResolvedValue(success(null))

      const result = await store.deleteGoal(1)

      expect(result.success).toBe(true)
      expect(store.goals).toEqual([{ id: 2 }])
    })

    it('propaga erro da API ao criar meta sem alterar a lista', async () => {
      const error = new Error('fail')
      error.response = { data: { message: 'Valor inválido' } }
      portfolioAPI.createGoal.mockRejectedValue(error)

      const result = await store.createGoal({ title: 'X' })

      expect(result).toEqual({ success: false, error: 'Valor inválido' })
      expect(store.goals).toEqual([])
    })
  })

  describe('Resumo', () => {
    it('atualiza summary e lastUpdate em fetchSummary', async () => {
      portfolioAPI.getSummary.mockResolvedValue(success({ totalValue: 50000 }))

      const result = await store.fetchSummary()

      expect(result.success).toBe(true)
      expect(store.summary.totalValue).toBe(50000)
      expect(store.lastUpdate).toBeInstanceOf(Date)
    })
  })
})
