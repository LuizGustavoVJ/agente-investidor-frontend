import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    disconnectBroker: vi.fn(),
    testConnection: vi.fn(),
    updateCredentials: vi.fn(),
    getSyncStatus: vi.fn(),
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getPendingConflicts: vi.fn()
  }
}))

const xp = {
  connectionId: 7,
  id: 'xp',
  name: 'XP Investimentos',
  status: 'error',
  connectionStatus: 'error',
  credentialStatus: 'invalid'
}

const clear = {
  connectionId: 8,
  id: 'clear',
  name: 'Clear',
  status: 'active',
  connectionStatus: 'ok',
  credentialStatus: 'valid'
}

describe('Brokers store — coerção de id e fetchSyncStatus que apaga sync em curso', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
    store.connectedBrokers = [{ ...xp }, { ...clear }]
  })

  it('disconnectBroker("7") com connectionId 7 devolve success e a XP permanece', async () => {
    brokersAPI.disconnectBroker.mockResolvedValue({
      data: { success: true }
    })

    const result = await store.disconnectBroker('7')

    expect(result.success).toBe(true)
    expect(brokersAPI.disconnectBroker).toHaveBeenCalledWith('7')
    expect(store.connectedBrokers).toHaveLength(2)
    expect(store.connectedBrokers.map((b) => b.connectionId)).toEqual([7, 8])
    expect(store.inactiveBrokers.some((b) => b.connectionId === 7)).toBe(true)
  })

  it('testConnection("7") e updateCredentials("7") devolvem success e o card XP não muda', async () => {
    brokersAPI.testConnection.mockResolvedValue({
      data: { success: true, data: { status: 'ok' } }
    })
    brokersAPI.updateCredentials.mockResolvedValue({
      data: { success: true }
    })

    const testResult = await store.testConnection('7')
    const credResult = await store.updateCredentials('7', { token: 'novo' })

    expect(testResult.success).toBe(true)
    expect(credResult.success).toBe(true)
    expect(store.connectedBrokers[0].connectionStatus).toBe('error')
    expect(store.connectedBrokers[0].credentialStatus).toBe('invalid')
    expect(store.connectedBrokers[0].status).toBe('error')
    expect(store.activeBrokers.map((b) => b.connectionId)).toEqual([8])
  })

  it('fetchSyncStatus() sem id substitui o mapa e apaga isRunning da sync em curso', async () => {
    store.syncStatus = {
      7: { isRunning: true, startTime: new Date('2026-10-26T10:00:00Z') }
    }
    expect(store.isSyncing).toBe(true)

    brokersAPI.getSyncStatus.mockResolvedValue({
      data: {
        success: true,
        data: { 8: { isRunning: false, status: 'idle' } }
      }
    })

    const result = await store.fetchSyncStatus()

    expect(result.success).toBe(true)
    expect(brokersAPI.getSyncStatus).toHaveBeenCalledWith(null)
    expect(store.syncStatus[7]).toBeUndefined()
    expect(store.syncStatus[8]).toEqual({ isRunning: false, status: 'idle' })
    expect(store.isSyncing).toBe(false)
  })
})
