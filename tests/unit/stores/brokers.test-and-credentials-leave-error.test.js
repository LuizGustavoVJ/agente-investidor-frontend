import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    testConnection: vi.fn(),
    updateCredentials: vi.fn(),
    resolveDataConflict: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getAvailableBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn()
  }
}))

describe('Brokers store — teste/credenciais ok deixam o card em error e conflito não recarrega', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('testConnection success grava connectionStatus e deixa status=error / activeBrokers vazio', async () => {
    store.connectedBrokers = [
      {
        id: 10,
        connectionId: 'xp-1',
        name: 'XP Investimentos',
        status: 'error',
        hasErrors: true,
        connectionStatus: 'failed'
      }
    ]

    brokersAPI.testConnection.mockResolvedValue({
      data: { success: true, data: { status: 'active' } }
    })

    const result = await store.testConnection('xp-1')

    expect(result.success).toBe(true)
    expect(brokersAPI.testConnection).toHaveBeenCalledWith('xp-1')
    expect(store.connectedBrokers[0].connectionStatus).toBe('active')
    expect(store.connectedBrokers[0].lastTest).toBeInstanceOf(Date)
    expect(store.connectedBrokers[0].status).toBe('error')
    expect(store.connectedBrokers[0].hasErrors).toBe(true)
    expect(store.activeBrokers).toHaveLength(0)
    expect(store.brokersWithErrors).toHaveLength(1)
  })

  it('updateCredentials success marca credentialStatus=valid e o card continua error', async () => {
    store.connectedBrokers = [
      {
        id: 10,
        connectionId: 'xp-1',
        name: 'XP Investimentos',
        status: 'error',
        hasErrors: true,
        credentialStatus: 'invalid'
      }
    ]

    brokersAPI.updateCredentials.mockResolvedValue({
      data: { success: true }
    })

    const result = await store.updateCredentials('xp-1', { token: 'novo-token' })

    expect(result.success).toBe(true)
    expect(store.connectedBrokers[0].credentialStatus).toBe('valid')
    expect(store.connectedBrokers[0].lastCredentialUpdate).toBeInstanceOf(Date)
    expect(store.connectedBrokers[0].status).toBe('error')
    expect(store.connectedBrokers[0].hasErrors).toBe(true)
    expect(store.activeBrokers).toHaveLength(0)
  })

  it('resolveConflict remove o item e não recarrega corretoras conectadas', async () => {
    store.connectedBrokers = [
      {
        id: 10,
        connectionId: 'xp-1',
        name: 'XP Investimentos',
        status: 'active',
        positions: 12
      }
    ]
    store.pendingConflicts = [
      { id: 'c-1', connectionId: 'xp-1', type: 'duplicate-position' },
      { id: 'c-2', connectionId: 'btg-1', type: 'price-mismatch' }
    ]

    brokersAPI.resolveDataConflict.mockResolvedValue({
      data: { success: true }
    })

    const result = await store.resolveConflict('c-1', { action: 'keep-local' })

    expect(result.success).toBe(true)
    expect(store.pendingConflicts.map((item) => item.id)).toEqual(['c-2'])
    expect(store.hasPendingConflicts).toBe(true)
    expect(store.connectedBrokers[0].positions).toBe(12)
    expect(brokersAPI.getConnectedBrokers).not.toHaveBeenCalled()
    expect(brokersAPI.getPendingConflicts).not.toHaveBeenCalled()
  })
})
