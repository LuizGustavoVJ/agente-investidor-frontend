import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    syncBroker: vi.fn(),
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    getSyncHistory: vi.fn()
  }
}))

describe('Brokers store — sync bem-sucedido não limpa status error do card', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('syncBroker success atualiza só syncStatus — connectedBrokers[].status permanece error', async () => {
    store.connectedBrokers = [
      {
        id: 10,
        connectionId: 'xp-1',
        name: 'XP Investimentos',
        status: 'error',
        hasErrors: true
      }
    ]

    brokersAPI.syncBroker.mockResolvedValue({
      data: { success: true, data: { syncedAssets: 42 } }
    })

    const result = await store.syncBroker('xp-1')

    expect(result.success).toBe(true)
    expect(brokersAPI.syncBroker).toHaveBeenCalledWith('xp-1')
    expect(store.syncStatus['xp-1'].status).toBe('success')
    expect(store.syncStatus['xp-1'].isRunning).toBe(false)
    expect(store.connectedBrokers[0].status).toBe('error')
    expect(store.connectedBrokers[0].hasErrors).toBe(true)
    expect(store.activeBrokers).toHaveLength(0)
    expect(store.inactiveBrokers).toHaveLength(1)
  })
})
