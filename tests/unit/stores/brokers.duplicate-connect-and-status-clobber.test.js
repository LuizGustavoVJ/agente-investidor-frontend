import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncHistory: vi.fn(),
    resolveDataConflict: vi.fn(),
    updateCredentials: vi.fn()
  }
}))

import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

const ok = (data) => ({ data: { success: true, data } })

describe('Brokers: connect duplica, syncStatus global clobber e data null quebra getters', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('connectBroker sempre faz push — segunda conexão com o mesmo connectionId duplica a lista', async () => {
    const connection = { connectionId: 'xp-1', id: 'xp', name: 'XP', status: 'connected' }
    brokersAPI.connectBroker.mockResolvedValue(ok(connection))

    await store.connectBroker({ brokerId: 'xp', credentials: { token: 'a' }, accountType: 'pf' })
    await store.connectBroker({ brokerId: 'xp', credentials: { token: 'a' }, accountType: 'pf' })

    expect(store.connectedBrokers).toHaveLength(2)
    expect(store.connectedBrokers.map((b) => b.connectionId)).toEqual(['xp-1', 'xp-1'])
    expect(store.totalConnectedBrokers).toBe(2)
  })

  it('fetchSyncStatus() sem id substitui o mapa inteiro e apaga isRunning de um sync em voo', async () => {
    store.syncStatus = {
      'xp-1': { isRunning: true, startTime: new Date('2026-11-26T10:00:00.000Z') },
      'cl-1': { isRunning: true, startTime: new Date('2026-11-26T10:00:01.000Z') }
    }
    brokersAPI.getSyncStatus.mockResolvedValue(ok({}))

    const result = await store.fetchSyncStatus()

    expect(result.success).toBe(true)
    expect(store.syncStatus).toEqual({})
    expect(store.syncStatus['xp-1']).toBeUndefined()
    expect(store.isSyncing).toBe(false)
  })

  it('fetchConnectedBrokers success com data:null faz activeBrokers lançar', async () => {
    brokersAPI.getConnectedBrokers.mockResolvedValue(ok(null))

    const result = await store.fetchConnectedBrokers()

    expect(result.success).toBe(true)
    expect(store.connectedBrokers).toBeNull()
    expect(() => store.activeBrokers).toThrow()
    expect(() => store.inactiveBrokers).toThrow()
    expect(() => store.brokersWithErrors).toThrow()
    expect(() => store.totalConnectedBrokers).toThrow()
  })

  it('fetchPendingConflicts success com data:null faz hasPendingConflicts lançar', async () => {
    brokersAPI.getPendingConflicts.mockResolvedValue(ok(null))

    const result = await store.fetchPendingConflicts()

    expect(result.success).toBe(true)
    expect(store.pendingConflicts).toBeNull()
    expect(() => store.hasPendingConflicts).toThrow()
  })
})
