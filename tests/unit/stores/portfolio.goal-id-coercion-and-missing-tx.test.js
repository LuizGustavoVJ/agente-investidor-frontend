import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'
import { portfolioAPI } from '@/api/portfolio'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn(),
    getAllocation: vi.fn(),
    getEvolution: vi.fn(),
    getAssets: vi.fn(),
    getTransactions: vi.fn(),
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    getGoals: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    getPerformance: vi.fn(),
    getRiskAnalysis: vi.fn(),
    syncBrokers: vi.fn()
  }
}))

const reserva = {
  id: 10,
  title: 'Reserva de Emergência',
  status: 'active',
  targetValue: 30000,
  currentValue: 9000
}

describe('Portfolio — id de meta string/número e transações manuais ausentes', () => {
  let portfolioStore

  beforeEach(() => {
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
    vi.clearAllMocks()
    portfolioStore.goals = [{ ...reserva }]
    portfolioStore.transactions = [
      { id: 1, symbol: 'PETR4', type: 'buy', quantity: 100, date: '2026-01-10' }
    ]
  })

  it('updateGoal("10") com meta id: 10 devolve sucesso e o título na store não muda', async () => {
    portfolioAPI.updateGoal.mockResolvedValue({
      data: {
        success: true,
        data: { ...reserva, title: 'Reserva 2026', targetValue: 40000 }
      }
    })

    const result = await portfolioStore.updateGoal('10', {
      title: 'Reserva 2026',
      targetValue: 40000
    })

    expect(result.success).toBe(true)
    expect(portfolioAPI.updateGoal).toHaveBeenCalledWith('10', {
      title: 'Reserva 2026',
      targetValue: 40000
    })
    expect(portfolioStore.goals).toHaveLength(1)
    expect(portfolioStore.goals[0].title).toBe('Reserva de Emergência')
    expect(portfolioStore.goals[0].targetValue).toBe(30000)
    expect(portfolioStore.activeGoals).toHaveLength(1)
  })

  it('deleteGoal("10") com meta id: 10 devolve sucesso e a meta permanece', async () => {
    portfolioAPI.deleteGoal.mockResolvedValue({
      data: { success: true }
    })

    const result = await portfolioStore.deleteGoal('10')

    expect(result.success).toBe(true)
    expect(portfolioAPI.deleteGoal).toHaveBeenCalledWith('10')
    expect(portfolioStore.goals).toEqual([reserva])
    expect(portfolioStore.activeGoals.map((goal) => goal.id)).toEqual([10])
  })

  it('store não expõe add/update/delete de transação — a API existe e o histórico local não muda', () => {
    expect(typeof portfolioAPI.addTransaction).toBe('function')
    expect(typeof portfolioAPI.updateTransaction).toBe('function')
    expect(typeof portfolioAPI.deleteTransaction).toBe('function')

    expect(portfolioStore.addTransaction).toBeUndefined()
    expect(portfolioStore.updateTransaction).toBeUndefined()
    expect(portfolioStore.deleteTransaction).toBeUndefined()
    expect(portfolioStore.transactions).toEqual([
      { id: 1, symbol: 'PETR4', type: 'buy', quantity: 100, date: '2026-01-10' }
    ])
  })
})
