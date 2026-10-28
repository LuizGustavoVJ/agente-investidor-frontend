import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    getBrokerTransactions: vi.fn(),
    getBrokerStatement: vi.fn(),
    getBrokerFees: vi.fn(),
    mapAssets: vi.fn(),
    getAssetMapping: vi.fn(),
    configureAutoSync: vi.fn(),
    exportToBroker: vi.fn()
  }
}))

describe('Brokers — extrato, taxas, mapeamento e auto-sync PUT existem na API e somem na store', () => {
  let brokersStore

  beforeEach(() => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.clearAllMocks()
    brokersStore.connectedBrokers = [
      {
        connectionId: 7,
        name: 'XP',
        status: 'active',
        totalBalance: 125000,
        assetsCount: 12
      }
    ]
  })

  it('store não expõe transações, extrato nem taxas — saldo da XP permanece só local', () => {
    expect(typeof brokersAPI.getBrokerTransactions).toBe('function')
    expect(typeof brokersAPI.getBrokerStatement).toBe('function')
    expect(typeof brokersAPI.getBrokerFees).toBe('function')

    expect(brokersStore.getBrokerTransactions).toBeUndefined()
    expect(brokersStore.fetchBrokerTransactions).toBeUndefined()
    expect(brokersStore.getBrokerStatement).toBeUndefined()
    expect(brokersStore.fetchBrokerStatement).toBeUndefined()
    expect(brokersStore.getBrokerFees).toBeUndefined()
    expect(brokersStore.fetchBrokerFees).toBeUndefined()
    expect(brokersStore.connectedBrokers[0].totalBalance).toBe(125000)
    expect(brokersStore.connectedBrokers[0].assetsCount).toBe(12)
  })

  it('store não expõe mapAssets, configureAutoSync nem exportToBroker', () => {
    expect(typeof brokersAPI.mapAssets).toBe('function')
    expect(typeof brokersAPI.getAssetMapping).toBe('function')
    expect(typeof brokersAPI.configureAutoSync).toBe('function')
    expect(typeof brokersAPI.exportToBroker).toBe('function')

    expect(brokersStore.mapAssets).toBeUndefined()
    expect(brokersStore.getAssetMapping).toBeUndefined()
    expect(brokersStore.configureAutoSync).toBeUndefined()
    expect(brokersStore.exportToBroker).toBeUndefined()
    expect(brokersStore.connectedBrokers).toHaveLength(1)
    expect(brokersStore.connectedBrokers[0].name).toBe('XP')
  })
})
