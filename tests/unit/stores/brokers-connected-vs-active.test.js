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

describe('Brokers — status "connected" vs "active"', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('activeBrokers ignora status "connected" (vocabulário da view Corretoras)', () => {
    store.connectedBrokers = [
      { connectionId: 'xp', name: 'XP', status: 'connected' },
      { connectionId: 'clear', name: 'Clear', status: 'active' },
      { connectionId: 'rico', name: 'Rico', status: 'error' }
    ]

    expect(store.activeBrokers.map((b) => b.connectionId)).toEqual(['clear'])
    expect(store.inactiveBrokers.map((b) => b.connectionId)).toEqual(['xp', 'rico'])
  })

  it('syncAllBrokers só marca isRunning nas ativas — "connected" fica de fora do status de sync', async () => {
    store.connectedBrokers = [
      { connectionId: 'xp', status: 'connected' },
      { connectionId: 'clear', status: 'active' }
    ]
    brokersAPI.syncAllBrokers.mockResolvedValue({
      data: { success: true, data: { started: true } }
    })

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(store.syncStatus.clear?.isRunning).toBe(true)
    expect(store.syncStatus.xp).toBeUndefined()
  })
})
