import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const brokersAPI = vi.hoisted(() => ({
  getAvailableBrokers: vi.fn(),
  getConnectedBrokers: vi.fn(),
  getSyncStatus: vi.fn(),
  getPendingConflicts: vi.fn(),
  getSyncHistory: vi.fn()
}))

vi.mock('@/api/brokers', () => ({ brokersAPI }))

import { useBrokersStore } from '@/stores/brokers'

const ok = (data) => Promise.resolve({ data: { success: true, data } })

describe('brokers loadAllData — omite histórico de sincronização', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()

    brokersAPI.getAvailableBrokers.mockImplementation(() => ok([]))
    brokersAPI.getConnectedBrokers.mockImplementation(() =>
      ok([{ id: 'conn-xp', name: 'XP', status: 'active' }])
    )
    brokersAPI.getSyncStatus.mockImplementation(() => ok({}))
    brokersAPI.getPendingConflicts.mockImplementation(() => ok([]))
    brokersAPI.getSyncHistory.mockImplementation(() =>
      ok([
        {
          id: 'sync-1',
          brokerId: 'conn-xp',
          brokerName: 'XP',
          status: 'success',
          assetsSynced: 14
        }
      ])
    )
  })

  it('não chama getSyncHistory no carregamento inicial', async () => {
    const result = await store.loadAllData()

    expect(result).toEqual({ success: true })
    expect(brokersAPI.getAvailableBrokers).toHaveBeenCalled()
    expect(brokersAPI.getConnectedBrokers).toHaveBeenCalled()
    expect(brokersAPI.getSyncStatus).toHaveBeenCalled()
    expect(brokersAPI.getPendingConflicts).toHaveBeenCalled()
    expect(brokersAPI.getSyncHistory).not.toHaveBeenCalled()
  })

  it('histórico permanece vazio mesmo quando a API teria entradas', async () => {
    await store.loadAllData()

    expect(store.syncHistory).toEqual([])
    expect(store.connectedBrokers).toHaveLength(1)
  })

  it('fetchSyncHistory isolado preenche a lista, mas loadAllData não o usa', async () => {
    await store.fetchSyncHistory('conn-xp')
    expect(store.syncHistory).toHaveLength(1)
    expect(store.syncHistory[0].assetsSynced).toBe(14)

    store.syncHistory = []
    await store.loadAllData()

    expect(brokersAPI.getSyncHistory).toHaveBeenCalledTimes(1)
    expect(store.syncHistory).toEqual([])
  })
})
