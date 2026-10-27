import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { usePortfolioStore } from '@/stores/portfolio'
import { brokersAPI } from '@/api/brokers'
import { portfolioAPI } from '@/api/portfolio'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    configureBrokerNotifications: vi.fn(),
    getNotificationConfiguration: vi.fn(),
    getSyncConfiguration: vi.fn(),
    getBrokerCapabilities: vi.fn(),
    getBrokerPositions: vi.fn(),
    getBrokerBalance: vi.fn(),
    getAccountInfo: vi.fn()
  }
}))

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn(),
    getAllocation: vi.fn(),
    getEvolution: vi.fn(),
    getAssets: vi.fn(),
    getTransactions: vi.fn(),
    getGoals: vi.fn(),
    getPerformance: vi.fn(),
    getBenchmarkComparison: vi.fn(),
    getConsolidatedReport: vi.fn(),
    exportData: vi.fn(),
    getSyncStatus: vi.fn()
  }
}))

describe('Brokers/Portfolio — posições, saldo, relatório e benchmark existem na API e somem na store', () => {
  let brokersStore
  let portfolioStore

  beforeEach(() => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    portfolioStore = usePortfolioStore()
    vi.clearAllMocks()
    brokersStore.connectedBrokers = [
      { connectionId: 7, name: 'XP', status: 'active', totalBalance: 125000 }
    ]
    portfolioStore.summary = { totalValue: 125000, totalGain: 8000 }
    portfolioStore.allocation = { byType: { stocks: { percentage: 60 } } }
  })

  it('store de corretoras não expõe notificações, capabilities, posições, saldo nem conta', () => {
    expect(typeof brokersAPI.configureBrokerNotifications).toBe('function')
    expect(typeof brokersAPI.getNotificationConfiguration).toBe('function')
    expect(typeof brokersAPI.getSyncConfiguration).toBe('function')
    expect(typeof brokersAPI.getBrokerCapabilities).toBe('function')
    expect(typeof brokersAPI.getBrokerPositions).toBe('function')
    expect(typeof brokersAPI.getBrokerBalance).toBe('function')
    expect(typeof brokersAPI.getAccountInfo).toBe('function')

    expect(brokersStore.configureBrokerNotifications).toBeUndefined()
    expect(brokersStore.getNotificationConfiguration).toBeUndefined()
    expect(brokersStore.getSyncConfiguration).toBeUndefined()
    expect(brokersStore.getBrokerCapabilities).toBeUndefined()
    expect(brokersStore.getBrokerPositions).toBeUndefined()
    expect(brokersStore.getBrokerBalance).toBeUndefined()
    expect(brokersStore.getAccountInfo).toBeUndefined()
    expect(brokersStore.connectedBrokers[0].totalBalance).toBe(125000)
  })

  it('store de portfolio não expõe benchmark, relatório, export nem sync status — alocação local não muda', () => {
    expect(typeof portfolioAPI.getBenchmarkComparison).toBe('function')
    expect(typeof portfolioAPI.getConsolidatedReport).toBe('function')
    expect(typeof portfolioAPI.exportData).toBe('function')
    expect(typeof portfolioAPI.getSyncStatus).toBe('function')

    expect(portfolioStore.getBenchmarkComparison).toBeUndefined()
    expect(portfolioStore.getConsolidatedReport).toBeUndefined()
    expect(portfolioStore.exportData).toBeUndefined()
    expect(portfolioStore.getSyncStatus).toBeUndefined()
    expect(portfolioStore.totalValue).toBe(125000)
    expect(portfolioStore.assetsByType).toEqual({ stocks: { percentage: 60 } })
  })
})
