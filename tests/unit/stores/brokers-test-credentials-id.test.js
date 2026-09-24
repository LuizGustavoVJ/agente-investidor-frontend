import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    resolveDataConflict: vi.fn(),
    disconnectBroker: vi.fn(),
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    connectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getSyncHistory: vi.fn(),
    getPendingConflicts: vi.fn(),
    updateCredentials: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'
import { useBrokersStore } from '@/stores/brokers'

describe('Brokers — testConnection e updateCredentials com id string vs número', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('testConnection("5") não atualiza a conexão com connectionId 5', async () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 5, name: 'Clear', connectionStatus: 'unknown' }
    ]
    brokersAPI.testConnection.mockResolvedValue({
      data: { success: true, data: { status: 'ok' } }
    })

    const result = await store.testConnection('5')

    expect(result.success).toBe(true)
    expect(brokersAPI.testConnection).toHaveBeenCalledWith('5')
    expect(store.connectedBrokers[0].connectionStatus).toBe('unknown')
    expect(store.connectedBrokers[0].lastTest).toBeUndefined()
  })

  it('testConnection(5) atualiza o status local', async () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 5, name: 'Clear', connectionStatus: 'unknown' }
    ]
    brokersAPI.testConnection.mockResolvedValue({
      data: { success: true, data: { status: 'ok' } }
    })

    const result = await store.testConnection(5)

    expect(result.success).toBe(true)
    expect(store.connectedBrokers[0].connectionStatus).toBe('ok')
    expect(store.connectedBrokers[0].lastTest).toBeInstanceOf(Date)
  })

  it('updateCredentials("8") não marca credencial local com connectionId 8', async () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 8, name: 'Rico', credentialStatus: 'expired' }
    ]
    brokersAPI.updateCredentials.mockResolvedValue({ data: { success: true } })

    const result = await store.updateCredentials('8', { token: 'novo' })

    expect(result.success).toBe(true)
    expect(brokersAPI.updateCredentials).toHaveBeenCalledWith('8', { token: 'novo' })
    expect(store.connectedBrokers[0].credentialStatus).toBe('expired')
    expect(store.connectedBrokers[0].lastCredentialUpdate).toBeUndefined()
  })
})
