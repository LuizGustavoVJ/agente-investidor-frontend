import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

describe('Brokers: syncAll só marca status=active e testConnection pinta lastTest em falha', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-25T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('syncAllBrokers só seta isRunning em status==="active" e deixa o flag preso em true', async () => {
    store.connectedBrokers = [
      { connectionId: 'xp-1', name: 'XP', status: 'connected' },
      { connectionId: 'cl-1', name: 'Clear', status: 'active' }
    ]

    brokersAPI.syncAllBrokers.mockResolvedValue({
      data: { success: true, data: { synced: 2 } }
    })

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(store.syncStatus['xp-1']).toBeUndefined()
    expect(store.syncStatus['cl-1'].isRunning).toBe(true)
    expect(store.isSyncing).toBe(true)
  })

  it('testConnection success com status failed ainda grava lastTest e connectionStatus', async () => {
    store.connectedBrokers = [
      { connectionId: 'xp-1', name: 'XP', connectionStatus: 'ok', lastTest: null }
    ]

    brokersAPI.testConnection.mockResolvedValue({
      data: {
        success: true,
        data: { status: 'failed', message: 'Credencial recusada' }
      }
    })

    const result = await store.testConnection('xp-1')

    expect(result.success).toBe(true)
    expect(store.connectedBrokers[0].connectionStatus).toBe('failed')
    expect(store.connectedBrokers[0].lastTest).toEqual(new Date('2026-11-25T10:00:00.000Z'))
  })
})
