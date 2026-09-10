import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const brokersAPI = vi.hoisted(() => ({
  getAvailableBrokers: vi.fn(),
  getConnectedBrokers: vi.fn(),
  getSyncStatus: vi.fn(),
  getPendingConflicts: vi.fn(),
  syncAllBrokers: vi.fn()
}))

vi.mock('@/api/brokers', () => ({ brokersAPI }))

import { useBrokersStore } from '@/stores/brokers'

const fail = (message) => ({
  data: { success: false, message }
})

describe('Brokers store — loadAllData e syncAll', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadAllData devolve success mesmo quando todos os fetches falham', async () => {
    brokersAPI.getAvailableBrokers.mockResolvedValue(fail('indisponível'))
    brokersAPI.getConnectedBrokers.mockResolvedValue(fail('sem conexões'))
    brokersAPI.getSyncStatus.mockResolvedValue(fail('status falhou'))
    brokersAPI.getPendingConflicts.mockResolvedValue(fail('conflitos falharam'))

    const store = useBrokersStore()
    const result = await store.loadAllData()

    expect(result).toEqual({ success: true })
    expect(store.availableBrokers).toEqual([])
    expect(store.connectedBrokers).toEqual([])
    expect(store.error).toBeTruthy()
  })

  it('syncAllBrokers marca isRunning depois do sucesso (estado invertido)', async () => {
    brokersAPI.syncAllBrokers.mockResolvedValue({
      data: { success: true, data: { synced: 1 } }
    })

    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 'conn-xp', status: 'active', name: 'XP' }
    ]

    expect(store.isSyncing).toBe(false)

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(store.syncStatus['conn-xp'].isRunning).toBe(true)
    expect(store.isSyncing).toBe(true)
  })
})
