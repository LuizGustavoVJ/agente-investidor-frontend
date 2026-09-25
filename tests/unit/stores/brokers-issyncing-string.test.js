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

describe('Brokers Store — isSyncing com isRunning string', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('isRunning "false" é truthy e a UI fica presa em sincronizando', () => {
    store.syncStatus = {
      3: { isRunning: 'false', status: 'success' }
    }

    expect(store.isSyncing).toBe(true)
  })

  it('isRunning "true" também marca como sincronizando', () => {
    store.syncStatus = {
      3: { isRunning: 'true' }
    }

    expect(store.isSyncing).toBe(true)
  })

  it('isRunning boolean false libera a UI', () => {
    store.syncStatus = {
      3: { isRunning: false, status: 'success' }
    }

    expect(store.isSyncing).toBe(false)
  })

  it('fetchSyncStatus(0) substitui o mapa inteiro porque 0 é falsy', async () => {
    store.syncStatus = {
      3: { isRunning: true },
      5: { isRunning: false }
    }
    brokersAPI.getSyncStatus.mockResolvedValue({
      data: { success: true, data: { isRunning: false, status: 'success' } }
    })

    const result = await store.fetchSyncStatus(0)

    expect(brokersAPI.getSyncStatus).toHaveBeenCalledWith(0)
    expect(result.success).toBe(true)
    expect(store.syncStatus).toEqual({ isRunning: false, status: 'success' })
  })
})

