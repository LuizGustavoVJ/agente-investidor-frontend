import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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
import { useBrokersStore } from '@/stores/brokers'

describe('Brokers — fetchSyncHistory substitui o histórico inteiro', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('buscar histórico de uma corretora apaga o das demais', async () => {
    store.syncHistory = [
      { id: 1, connectionId: 'xp', status: 'success' },
      { id: 2, connectionId: 'clear', status: 'error' }
    ]

    brokersAPI.getSyncHistory.mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 9, connectionId: 'rico', status: 'success' }]
      }
    })

    const result = await store.fetchSyncHistory('rico')

    expect(result.success).toBe(true)
    expect(brokersAPI.getSyncHistory).toHaveBeenCalledWith('rico', {})
    expect(store.syncHistory).toEqual([
      { id: 9, connectionId: 'rico', status: 'success' }
    ])
    expect(store.syncHistory.some((e) => e.connectionId === 'xp')).toBe(false)
  })
})
