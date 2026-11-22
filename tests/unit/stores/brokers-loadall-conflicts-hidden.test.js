import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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

const fail = (message) => ({ data: { success: false, message } })
const ok = (data) => ({ data: { success: true, data } })

describe('Brokers: loadAllData mente sucesso e conflitos não chegam na UI', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('loadAllData devolve success:true com todas as filhas em { success: false }', async () => {
    brokersAPI.getAvailableBrokers.mockResolvedValue(fail('disponíveis'))
    brokersAPI.getConnectedBrokers.mockResolvedValue(fail('conectadas'))
    brokersAPI.getSyncStatus.mockResolvedValue(fail('status'))
    brokersAPI.getPendingConflicts.mockResolvedValue(fail('conflitos'))

    const result = await store.loadAllData()

    expect(result.success).toBe(true)
    expect(store.connectedBrokers).toEqual([])
    expect(store.pendingConflicts).toEqual([])
    expect(store.hasPendingConflicts).toBe(false)
  })

  it('fetchPendingConflicts hidrata a store mas Corretoras.vue nunca lê pendingConflicts/hasPendingConflicts', async () => {
    const conflicts = [
      { id: 1, symbol: 'PETR4', connectionId: 'xp-1', resolution: null }
    ]
    brokersAPI.getPendingConflicts.mockResolvedValue(ok(conflicts))

    await store.fetchPendingConflicts()

    expect(store.pendingConflicts).toEqual(conflicts)
    expect(store.hasPendingConflicts).toBe(true)

    const viewSource = readFileSync(
      resolve(__dirname, '../../../src/views/Corretoras.vue'),
      'utf8'
    )

    expect(viewSource).not.toMatch(/pendingConflicts/)
    expect(viewSource).not.toMatch(/hasPendingConflicts/)
    expect(viewSource).not.toMatch(/resolveConflict/)
    expect(viewSource).toMatch(/loadAllData/)
  })

})
