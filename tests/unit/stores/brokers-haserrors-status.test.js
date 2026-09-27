import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'

describe('Brokers store — brokersWithErrors ignora status error sem hasErrors', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('corretora com status error e sem hasErrors some do getter de erros', () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 'xp-1', name: 'XP', status: 'error', errorMessage: 'timeout' },
      { connectionId: 'clear-1', name: 'Clear', status: 'active', hasErrors: true }
    ]

    expect(store.brokersWithErrors).toHaveLength(1)
    expect(store.brokersWithErrors[0].connectionId).toBe('clear-1')
    expect(store.brokersWithErrors.some((broker) => broker.connectionId === 'xp-1')).toBe(false)
  })

  it('hasErrors false não entra mesmo com status error', () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 'rico-1', name: 'Rico', status: 'error', hasErrors: false }
    ]

    expect(store.brokersWithErrors).toEqual([])
  })
})
