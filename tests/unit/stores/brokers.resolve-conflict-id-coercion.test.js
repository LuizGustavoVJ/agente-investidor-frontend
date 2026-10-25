import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    resolveDataConflict: vi.fn(),
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn()
  }
}))

describe('Brokers store — resolveConflict com id string vs número', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('sucesso com conflictId "7" e conflict.id 7 devolve success e o conflito permanece', async () => {
    store.pendingConflicts = [
      { id: 7, type: 'duplicate-asset', symbol: 'PETR4' },
      { id: 8, type: 'price-mismatch', symbol: 'VALE3' }
    ]
    brokersAPI.resolveDataConflict.mockResolvedValue({
      data: { success: true }
    })

    const result = await store.resolveConflict('7', { action: 'keep-local' })

    expect(result.success).toBe(true)
    expect(brokersAPI.resolveDataConflict).toHaveBeenCalledWith('7', { action: 'keep-local' })
    expect(store.pendingConflicts).toHaveLength(2)
    expect(store.pendingConflicts.map((c) => c.id)).toEqual([7, 8])
    expect(store.hasPendingConflicts).toBe(true)
  })

  it('sucesso com o mesmo tipo numérico remove só o conflito 7', async () => {
    store.pendingConflicts = [
      { id: 7, type: 'duplicate-asset', symbol: 'PETR4' },
      { id: 8, type: 'price-mismatch', symbol: 'VALE3' }
    ]
    brokersAPI.resolveDataConflict.mockResolvedValue({
      data: { success: true }
    })

    const result = await store.resolveConflict(7, { action: 'keep-broker' })

    expect(result.success).toBe(true)
    expect(store.pendingConflicts).toHaveLength(1)
    expect(store.pendingConflicts[0].id).toBe(8)
  })
})
