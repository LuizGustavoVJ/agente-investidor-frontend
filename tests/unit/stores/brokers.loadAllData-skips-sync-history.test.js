import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
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

describe('Brokers store — loadAllData nunca busca histórico de sync', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()

    brokersAPI.getAvailableBrokers.mockResolvedValue({ data: { success: true, data: [] } })
    brokersAPI.getConnectedBrokers.mockResolvedValue({ data: { success: true, data: [] } })
    brokersAPI.getSyncStatus.mockResolvedValue({ data: { success: true, data: {} } })
    brokersAPI.getPendingConflicts.mockResolvedValue({ data: { success: true, data: [] } })
    brokersAPI.getSyncHistory.mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 99, brokerId: 1, status: 'error', message: 'timeout' }]
      }
    })
  })

  it('loadAllData não chama fetchSyncHistory e deixa syncHistory vazio', async () => {
    const result = await store.loadAllData()

    expect(result.success).toBe(true)
    expect(brokersAPI.getAvailableBrokers).toHaveBeenCalled()
    expect(brokersAPI.getConnectedBrokers).toHaveBeenCalled()
    expect(brokersAPI.getSyncStatus).toHaveBeenCalled()
    expect(brokersAPI.getPendingConflicts).toHaveBeenCalled()
    expect(brokersAPI.getSyncHistory).not.toHaveBeenCalled()
    expect(store.syncHistory).toEqual([])
  })

  it('fetchSyncHistory isolado preenche a lista — o gap é só o load agregado', async () => {
    const result = await store.fetchSyncHistory(1)

    expect(result.success).toBe(true)
    expect(store.syncHistory).toHaveLength(1)
    expect(store.syncHistory[0].status).toBe('error')
  })
})
