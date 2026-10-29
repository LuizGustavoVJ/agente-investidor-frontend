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
    getConnectionLogs: vi.fn(),
    validateImportedData: vi.fn(),
    getImportReport: vi.fn()
  }
}))

const ok = (data) => ({ data: { success: true, data } })

describe('Brokers — logs, validação de importação e relatório existem na API e somem na store', () => {
  let brokersStore

  beforeEach(() => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.clearAllMocks()
    brokersStore.connectedBrokers = [
      {
        connectionId: 'xp/acc-1',
        name: 'XP',
        status: 'active',
        totalBalance: 125000
      }
    ]
    brokersStore.syncHistory = []
    brokersStore.pendingConflicts = [
      { id: 7, symbol: 'PETR4', type: 'quantity' }
    ]
  })

  it('store não expõe getConnectionLogs, validateImportedData nem getImportReport', () => {
    expect(typeof brokersAPI.getConnectionLogs).toBe('function')
    expect(typeof brokersAPI.validateImportedData).toBe('function')
    expect(typeof brokersAPI.getImportReport).toBe('function')

    expect(brokersStore.getConnectionLogs).toBeUndefined()
    expect(brokersStore.fetchConnectionLogs).toBeUndefined()
    expect(brokersStore.validateImportedData).toBeUndefined()
    expect(brokersStore.getImportReport).toBeUndefined()
    expect(brokersStore.fetchImportReport).toBeUndefined()
    expect(brokersStore.connectionLogs).toBeUndefined()
    expect(brokersStore.importReports).toBeUndefined()
    expect(brokersStore.connectedBrokers[0].totalBalance).toBe(125000)
    expect(brokersStore.pendingConflicts).toEqual([
      { id: 7, symbol: 'PETR4', type: 'quantity' }
    ])
  })

  it('loadAllData não busca logs nem relatório de importação — conflito PETR4 permanece', async () => {
    brokersAPI.getAvailableBrokers.mockResolvedValue(ok([]))
    brokersAPI.getConnectedBrokers.mockResolvedValue(ok(brokersStore.connectedBrokers))
    brokersAPI.getSyncStatus.mockResolvedValue(ok({}))
    brokersAPI.getPendingConflicts.mockResolvedValue(ok(brokersStore.pendingConflicts))

    const result = await brokersStore.loadAllData()

    expect(result).toEqual({ success: true })
    expect(brokersAPI.getConnectionLogs).not.toHaveBeenCalled()
    expect(brokersAPI.validateImportedData).not.toHaveBeenCalled()
    expect(brokersAPI.getImportReport).not.toHaveBeenCalled()
    expect(brokersStore.syncHistory).toEqual([])
    expect(brokersStore.pendingConflicts[0].symbol).toBe('PETR4')
    expect(brokersStore.connectedBrokers[0].name).toBe('XP')
  })
})
