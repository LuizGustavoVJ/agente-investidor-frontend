import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    testConnection: vi.fn(),
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getSyncHistory: vi.fn(),
    getPendingConflicts: vi.fn(),
    updateCredentials: vi.fn(),
    resolveDataConflict: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'
import { useBrokersStore } from '@/stores/brokers'

describe('Brokers Store — testConnection grava connectionStatus, getters leem status', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('teste OK não tira a corretora de brokersWithErrors nem entra em activeBrokers', async () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      {
        connectionId: 7,
        name: 'XP',
        status: 'error',
        hasErrors: true,
        connectionStatus: 'error'
      }
    ]

    brokersAPI.testConnection.mockResolvedValue({
      data: { success: true, data: { status: 'active' } }
    })

    const result = await store.testConnection(7)

    expect(result.success).toBe(true)
    expect(store.connectedBrokers[0].connectionStatus).toBe('active')
    expect(store.connectedBrokers[0].status).toBe('error')
    expect(store.connectedBrokers[0].hasErrors).toBe(true)
    expect(store.activeBrokers).toHaveLength(0)
    expect(store.brokersWithErrors).toHaveLength(1)
    expect(store.inactiveBrokers).toHaveLength(1)
  })
})
