import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    resolveDataConflict: vi.fn(),
    disconnectBroker: vi.fn(),
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    connectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getSyncHistory: vi.fn(),
    getPendingConflicts: vi.fn(),
    updateCredentials: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'
import { useBrokersStore } from '@/stores/brokers'

describe('Brokers — IDs string vs número em conflito e desconexão', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('resolveConflict("7") não remove o conflito com id numérico 7', async () => {
    const store = useBrokersStore()
    store.pendingConflicts = [{ id: 7, description: 'preço divergente' }]
    brokersAPI.resolveDataConflict.mockResolvedValue({ data: { success: true } })

    const result = await store.resolveConflict('7', { action: 'keep_local' })

    expect(result.success).toBe(true)
    expect(brokersAPI.resolveDataConflict).toHaveBeenCalledWith('7', { action: 'keep_local' })
    expect(store.pendingConflicts).toHaveLength(1)
    expect(store.hasPendingConflicts).toBe(true)
  })

  it('resolveConflict(7) com id numérico remove o conflito', async () => {
    const store = useBrokersStore()
    store.pendingConflicts = [{ id: 7, description: 'preço divergente' }]
    brokersAPI.resolveDataConflict.mockResolvedValue({ data: { success: true } })

    const result = await store.resolveConflict(7, { action: 'keep_local' })

    expect(result.success).toBe(true)
    expect(store.pendingConflicts).toHaveLength(0)
    expect(store.hasPendingConflicts).toBe(false)
  })

  it('disconnectBroker("10") não remove a conexão com connectionId 10', async () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 10, name: 'XP', status: 'active' }
    ]
    brokersAPI.disconnectBroker.mockResolvedValue({ data: { success: true } })

    const result = await store.disconnectBroker('10')

    expect(result.success).toBe(true)
    expect(store.connectedBrokers).toHaveLength(1)
    expect(store.totalConnectedBrokers).toBe(1)
  })
})
