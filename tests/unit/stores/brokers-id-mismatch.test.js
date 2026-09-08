import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    disconnectBroker: vi.fn(),
    updateCredentials: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn()
  }
}))

import { brokersAPI } from '@/api/brokers'
import { useBrokersStore } from '@/stores/brokers'

const success = (data) => ({ data: { success: true, data } })

describe('Brokers Store — id vs connectionId e carga parcial', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('disconnectBroker só remove quando o argumento casa com connectionId, não com id da corretora', async () => {
    store.connectedBrokers = [
      { id: 'xp', connectionId: 'conn-1', name: 'XP' }
    ]
    brokersAPI.disconnectBroker.mockResolvedValue(success({}))

    const byProductId = await store.disconnectBroker('xp')

    expect(byProductId.success).toBe(true)
    expect(store.connectedBrokers).toHaveLength(1)

    const byConnectionId = await store.disconnectBroker('conn-1')

    expect(byConnectionId.success).toBe(true)
    expect(store.connectedBrokers).toHaveLength(0)
  })

  it('updateCredentials com conexão ausente ainda devolve sucesso sem lançar', async () => {
    store.connectedBrokers = []
    brokersAPI.updateCredentials.mockResolvedValue(success({}))

    const result = await store.updateCredentials('conn-ausente', { apiKey: 'k' })

    expect(result.success).toBe(true)
    expect(brokersAPI.updateCredentials).toHaveBeenCalledWith('conn-ausente', { apiKey: 'k' })
  })

  it('loadAllData devolve success mesmo quando um fetch individual falha', async () => {
    brokersAPI.getAvailableBrokers.mockResolvedValue({
      data: { success: false, message: 'Catálogo indisponível' }
    })
    brokersAPI.getConnectedBrokers.mockResolvedValue(success([]))
    brokersAPI.getSyncStatus.mockResolvedValue(success({}))
    brokersAPI.getPendingConflicts.mockResolvedValue(success([]))

    const result = await store.loadAllData()

    expect(result.success).toBe(true)
    expect(store.availableBrokers).toEqual([])
  })

  it('syncBroker usa o id recebido como chave de status, mesmo que não seja connectionId', async () => {
    brokersAPI.syncBroker.mockResolvedValue(success({ imported: 3 }))

    const result = await store.syncBroker('xp')

    expect(result.success).toBe(true)
    expect(store.syncStatus.xp.isRunning).toBe(false)
    expect(store.syncStatus.xp.status).toBe('success')
    expect(store.syncStatus['conn-1']).toBeUndefined()
  })
})
