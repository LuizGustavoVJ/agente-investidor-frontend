import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'

describe('Portfolio store — recentTransactions muta a lista canônica', () => {
  let portfolioStore

  beforeEach(() => {
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
  })

  it('ler recentTransactions reordena transactions in-place', () => {
    portfolioStore.transactions = [
      { id: 1, date: '2024-01-01', symbol: 'PETR4' },
      { id: 2, date: '2026-09-01', symbol: 'VALE3' },
      { id: 3, date: '2025-06-15', symbol: 'ITUB4' }
    ]

    expect(portfolioStore.transactions.map((tx) => tx.id)).toEqual([1, 2, 3])

    const recent = portfolioStore.recentTransactions

    expect(recent[0].id).toBe(2)
    expect(portfolioStore.transactions.map((tx) => tx.id)).toEqual([2, 3, 1])
  })

  it('transação sem date compara NaN e não fica estável no topo', () => {
    const valid = { id: 1, date: '2026-01-01', symbol: 'PETR4' }
    const missingDate = { id: 2, symbol: 'VALE3' }

    portfolioStore.transactions = [valid, missingDate]

    const recent = portfolioStore.recentTransactions

    expect(recent).toHaveLength(2)
    expect(recent.some((tx) => Number.isNaN(new Date(tx.date).getTime()))).toBe(true)
  })
})
