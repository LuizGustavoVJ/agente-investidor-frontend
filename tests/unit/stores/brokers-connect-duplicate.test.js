import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    connectBroker: vi.fn()
  }
}))

import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

describe('Brokers store — connectBroker duplica conexão no push', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('segunda conexão com o mesmo connectionId entra de novo na lista', async () => {
    const connection = {
      connectionId: 'xp-1',
      brokerId: 'xp',
      name: 'XP',
      status: 'active'
    }

    brokersAPI.connectBroker.mockResolvedValue({
      data: { success: true, data: connection }
    })

    const store = useBrokersStore()
    await store.connectBroker({ brokerId: 'xp', credentials: { token: 'a' } })
    await store.connectBroker({ brokerId: 'xp', credentials: { token: 'b' } })

    expect(store.connectedBrokers).toHaveLength(2)
    expect(store.connectedBrokers[0]).toEqual(connection)
    expect(store.connectedBrokers[1]).toEqual(connection)
    expect(store.totalConnectedBrokers).toBe(2)
    expect(store.activeBrokers).toHaveLength(2)
  })

  it('reconnect que devolve o mesmo connectionId não substitui o registro antigo', async () => {
    const existing = {
      connectionId: 'clear-9',
      brokerId: 'clear',
      name: 'Clear',
      status: 'active'
    }
    const reconnection = {
      connectionId: 'clear-9',
      brokerId: 'clear',
      name: 'Clear',
      status: 'active'
    }

    const store = useBrokersStore()
    store.connectedBrokers = [existing]

    brokersAPI.connectBroker.mockResolvedValue({
      data: { success: true, data: reconnection }
    })

    await store.connectBroker({ brokerId: 'clear', credentials: { token: 'x' } })

    expect(store.connectedBrokers).toHaveLength(2)
    expect(store.connectedBrokers.map((broker) => broker.connectionId)).toEqual([
      'clear-9',
      'clear-9'
    ])
  })
})
