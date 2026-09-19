import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const syncAllBrokers = vi.fn()

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: (...args) => syncAllBrokers(...args),
    getSyncStatus: vi.fn(),
    getSyncHistory: vi.fn(),
    getPendingConflicts: vi.fn(),
    resolveDataConflict: vi.fn(),
    updateCredentials: vi.fn()
  }
}))

import { useBrokersStore } from '@/stores/brokers'

describe('Brokers store — syncAll deixa isRunning ligado', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('sucesso marca corretoras ativas como isRunning true e nunca desliga', async () => {
    syncAllBrokers.mockResolvedValue({ data: { success: true, data: {} } })
    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 'xp-1', status: 'active' },
      { connectionId: 'clear-1', status: 'inactive' }
    ]

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(store.syncStatus['xp-1'].isRunning).toBe(true)
    expect(store.isSyncing).toBe(true)
    expect(store.syncStatus['clear-1']).toBeUndefined()
  })
})
