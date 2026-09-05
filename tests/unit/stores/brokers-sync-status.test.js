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

const success = (data) => ({ data: { success: true, data } })

describe('Brokers Store — status e histórico de sincronização', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('substitui o mapa inteiro quando fetchSyncStatus não recebe connectionId', async () => {
    store.syncStatus = { old: { isRunning: true } }
    brokersAPI.getSyncStatus.mockResolvedValue(
      success({ 'xp-1': { isRunning: false, status: 'success' } })
    )

    const result = await store.fetchSyncStatus()

    expect(brokersAPI.getSyncStatus).toHaveBeenCalledWith(null)
    expect(result.success).toBe(true)
    expect(store.syncStatus).toEqual({
      'xp-1': { isRunning: false, status: 'success' }
    })
  })

  it('atualiza só a conexão pedida em fetchSyncStatus', async () => {
    store.syncStatus = {
      'xp-1': { isRunning: true },
      'rico-2': { isRunning: false }
    }
    brokersAPI.getSyncStatus.mockResolvedValue(success({ isRunning: false, status: 'error' }))

    const result = await store.fetchSyncStatus('xp-1')

    expect(brokersAPI.getSyncStatus).toHaveBeenCalledWith('xp-1')
    expect(result.success).toBe(true)
    expect(store.syncStatus['xp-1']).toEqual({ isRunning: false, status: 'error' })
    expect(store.syncStatus['rico-2']).toEqual({ isRunning: false })
  })

  it('grava o histórico retornado pela API', async () => {
    const history = [{ id: 1, status: 'success' }, { id: 2, status: 'error' }]
    brokersAPI.getSyncHistory.mockResolvedValue(success(history))

    const result = await store.fetchSyncHistory('xp-1', { limit: 10 })

    expect(brokersAPI.getSyncHistory).toHaveBeenCalledWith('xp-1', { limit: 10 })
    expect(result.success).toBe(true)
    expect(store.syncHistory).toEqual(history)
  })

  it('não altera o histórico quando a API recusa', async () => {
    store.syncHistory = [{ id: 9 }]
    brokersAPI.getSyncHistory.mockResolvedValue({
      data: { success: false, message: 'Histórico indisponível' }
    })

    const result = await store.fetchSyncHistory('xp-1')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Histórico indisponível')
    expect(store.syncHistory).toEqual([{ id: 9 }])
  })

  it('carrega conflitos pendentes sem mexer no restante do estado', async () => {
    store.connectedBrokers = [{ connectionId: 'xp-1' }]
    brokersAPI.getPendingConflicts.mockResolvedValue(success([{ id: 'c1' }]))

    const result = await store.fetchPendingConflicts()

    expect(result.success).toBe(true)
    expect(store.pendingConflicts).toEqual([{ id: 'c1' }])
    expect(store.hasPendingConflicts).toBe(true)
    expect(store.connectedBrokers).toEqual([{ connectionId: 'xp-1' }])
  })

  it('não quebra testConnection quando a corretora não está na lista', async () => {
    store.connectedBrokers = []
    brokersAPI.testConnection.mockResolvedValue(success({ status: 'healthy' }))

    const result = await store.testConnection('ausente')

    expect(result.success).toBe(true)
    expect(store.connectedBrokers).toEqual([])
  })

  it('marca corretoras ativas como sincronizando após syncAll', async () => {
    store.connectedBrokers = [
      { connectionId: 'xp-1', status: 'active' },
      { connectionId: 'rico-2', status: 'paused' }
    ]
    brokersAPI.syncAllBrokers.mockResolvedValue(success({ queued: 1 }))

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(store.syncStatus['xp-1'].isRunning).toBe(true)
    expect(store.syncStatus['xp-1'].startTime).toBeInstanceOf(Date)
    expect(store.syncStatus['rico-2']).toBeUndefined()
    expect(store.lastSync).toBeInstanceOf(Date)
    expect(store.isLoading).toBe(false)
  })
})
