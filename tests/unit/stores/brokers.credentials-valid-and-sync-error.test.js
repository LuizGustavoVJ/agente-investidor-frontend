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

describe('Brokers: credencial "valid" local e erro de sync genérico', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('updateCredentials com success ignora credentialStatus pending da API e pinta valid', async () => {
    store.connectedBrokers = [
      { connectionId: 'xp-1', name: 'XP', credentialStatus: 'expired' }
    ]

    brokersAPI.updateCredentials.mockResolvedValue({
      data: {
        success: true,
        data: { credentialStatus: 'pending' }
      }
    })

    const result = await store.updateCredentials('xp-1', { token: 'novo' })

    expect(result.success).toBe(true)
    expect(store.connectedBrokers[0].credentialStatus).toBe('valid')
    expect(store.connectedBrokers[0].lastCredentialUpdate).toBeInstanceOf(Date)
  })

  it('syncBroker no catch grava err.message, não a mensagem da corretora em response.data', async () => {
    const apiError = {
      message: 'Network Error',
      response: { data: { message: 'Token XP inválido' } }
    }
    brokersAPI.syncBroker.mockRejectedValue(apiError)

    const result = await store.syncBroker('xp-1')

    expect(result.success).toBe(false)
    expect(store.syncStatus['xp-1'].status).toBe('error')
    expect(store.syncStatus['xp-1'].isRunning).toBe(false)
    expect(store.syncStatus['xp-1'].error).toBe('Network Error')
    expect(store.syncStatus['xp-1'].error).not.toBe('Token XP inválido')
    expect(store.error).toBe('Token XP inválido')
  })
})
