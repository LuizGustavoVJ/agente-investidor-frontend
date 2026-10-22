import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    getSyncHistory: vi.fn()
  }
}))

describe('Brokers — loadAllData perde isLoading no finally do filho', () => {
  let brokersStore

  beforeEach(() => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.clearAllMocks()
  })

  it('available termina primeiro: isLoading vira false com connectedBrokers ainda vazio', async () => {
    let resolveConnected
    brokersAPI.getAvailableBrokers.mockResolvedValue({
      data: { success: true, data: [{ id: 'xp', name: 'XP' }] }
    })
    brokersAPI.getConnectedBrokers.mockImplementation(
      () => new Promise((resolve) => {
        resolveConnected = resolve
      })
    )
    brokersAPI.getSyncStatus.mockResolvedValue({ data: { success: true, data: {} } })
    brokersAPI.getPendingConflicts.mockResolvedValue({ data: { success: true, data: [] } })

    const loadPromise = brokersStore.loadAllData()
    await flushPromises()

    expect(brokersStore.availableBrokers).toEqual([{ id: 'xp', name: 'XP' }])
    expect(brokersStore.connectedBrokers).toEqual([])
    expect(brokersStore.activeBrokers).toEqual([])
    expect(brokersStore.isLoading).toBe(false)

    resolveConnected({
      data: {
        success: true,
        data: [{ id: 'xp', name: 'XP', status: 'active', connectionId: 'c-xp' }]
      }
    })
    await loadPromise

    expect(brokersStore.connectedBrokers).toEqual([
      { id: 'xp', name: 'XP', status: 'active', connectionId: 'c-xp' }
    ])
    expect(brokersStore.activeBrokers).toHaveLength(1)
    expect(brokersStore.isLoading).toBe(false)
  })
})
