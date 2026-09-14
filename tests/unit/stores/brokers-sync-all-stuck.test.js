import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getSyncHistory: vi.fn(),
    getPendingConflicts: vi.fn(),
    resolveDataConflict: vi.fn(),
    updateCredentials: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'

describe('Brokers store — syncAll e vocabulário de status', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('não marca sync em corretoras "connected" — activeBrokers só aceita "active"', async () => {
    brokersAPI.syncAllBrokers.mockResolvedValue({ data: { success: true, data: {} } })

    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 'c-xp', name: 'XP', status: 'connected' },
      { connectionId: 'c-rico', name: 'Rico', status: 'syncing' }
    ]

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(store.activeBrokers).toHaveLength(0)
    expect(store.inactiveBrokers).toHaveLength(2)
    expect(store.syncStatus['c-xp']).toBeUndefined()
    expect(store.isSyncing).toBe(false)
  })

  it('em sucesso deixa isRunning true para status "active" e nunca limpa — isSyncing fica preso', async () => {
    brokersAPI.syncAllBrokers.mockResolvedValue({ data: { success: true, data: {} } })

    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 'c-active', name: 'Clear', status: 'active' }
    ]

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(store.syncStatus['c-active'].isRunning).toBe(true)
    expect(store.isSyncing).toBe(true)
  })

  it('brokersWithErrors ignora status "error" se hasErrors não vier no payload', () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 'c-err', name: 'XP', status: 'error' }
    ]

    expect(store.brokersWithErrors).toHaveLength(0)
  })
})
