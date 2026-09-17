import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    updateCredentials: vi.fn(),
    resolveDataConflict: vi.fn(),
    syncBroker: vi.fn(),
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'
import { useBrokersStore } from '@/stores/brokers'

describe('Brokers Store — credenciais sem conexão local e conflito com outro id', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('updateCredentials devolve sucesso mesmo se a conexão não está na lista local', async () => {
    store.connectedBrokers = [
      { connectionId: 'xp-1', name: 'XP', credentialStatus: 'expired' }
    ]
    brokersAPI.updateCredentials.mockResolvedValue({ data: { success: true } })

    const result = await store.updateCredentials('clear-99', { token: 'abc' })

    expect(result.success).toBe(true)
    expect(store.connectedBrokers[0].credentialStatus).toBe('expired')
    expect(store.connectedBrokers[0].lastCredentialUpdate).toBeUndefined()
  })

  it('resolveConflict filtra por conflict.id e deixa item que só tem conflictId', async () => {
    store.pendingConflicts = [
      { conflictId: 'c-1', broker: 'XP' },
      { id: 'c-2', broker: 'Clear' }
    ]
    brokersAPI.resolveDataConflict.mockResolvedValue({ data: { success: true } })

    const result = await store.resolveConflict('c-1', { keep: 'local' })

    expect(result.success).toBe(true)
    expect(store.pendingConflicts).toHaveLength(2)
    expect(store.pendingConflicts.map((conflict) => conflict.conflictId || conflict.id)).toEqual([
      'c-1',
      'c-2'
    ])
  })

  it('syncBroker com connectionId undefined grava status na chave undefined', async () => {
    brokersAPI.syncBroker.mockResolvedValue({
      data: { success: true, data: { imported: 3 } }
    })

    const result = await store.syncBroker(undefined)

    expect(result.success).toBe(true)
    expect(store.syncStatus.undefined.isRunning).toBe(false)
    expect(store.syncStatus.undefined.status).toBe('success')
  })
})
