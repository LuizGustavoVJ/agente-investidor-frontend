import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'

describe('Portfolio — recentTransactions faz sort in-place no array canônico', () => {
  let portfolioStore

  beforeEach(() => {
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
  })

  it('ao ler recentTransactions, reordena transactions na fonte (compra antiga sobe)', () => {
    portfolioStore.transactions = [
      { id: 1, symbol: 'PETR4', date: '2024-01-10', type: 'buy' },
      { id: 2, symbol: 'VALE3', date: '2025-06-01', type: 'buy' },
      { id: 3, symbol: 'ITUB4', date: '2026-03-15', type: 'sell' }
    ]

    const recent = portfolioStore.recentTransactions

    expect(recent.map((tx) => tx.symbol)).toEqual(['ITUB4', 'VALE3', 'PETR4'])
    expect(portfolioStore.transactions.map((tx) => tx.symbol)).toEqual(['ITUB4', 'VALE3', 'PETR4'])
    expect(portfolioStore.transactions[0]).toMatchObject({ id: 3, symbol: 'ITUB4' })
  })

  it('segunda leitura não restaura a ordem original da API', () => {
    const fromApi = [
      { id: 10, symbol: 'BBDC4', date: '2025-01-01' },
      { id: 11, symbol: 'WEGE3', date: '2026-01-01' }
    ]
    portfolioStore.transactions = fromApi

    void portfolioStore.recentTransactions

    expect(fromApi.map((tx) => tx.symbol)).toEqual(['WEGE3', 'BBDC4'])
    expect(portfolioStore.transactions.map((tx) => tx.symbol)).toEqual(['WEGE3', 'BBDC4'])
    expect(portfolioStore.recentTransactions[0].symbol).toBe('WEGE3')
  })
})
