import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    getSyncHistory: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'
import { useBrokersStore } from '@/stores/brokers'

describe('Brokers store — isSyncing e conflitos com entrada nula', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('isSyncing lança quando um valor do mapa de sync é null', () => {
    const store = useBrokersStore()
    store.syncStatus = {
      'conn-1': { isRunning: false },
      'conn-2': null
    }

    expect(() => store.isSyncing).toThrow()
  })

  it('fetchPendingConflicts com data:null faz hasPendingConflicts lançar', async () => {
    brokersAPI.getPendingConflicts.mockResolvedValue({
      data: { success: true, data: null }
    })

    const store = useBrokersStore()
    const result = await store.fetchPendingConflicts()

    expect(result.success).toBe(true)
    expect(() => store.hasPendingConflicts).toThrow()
  })
})
