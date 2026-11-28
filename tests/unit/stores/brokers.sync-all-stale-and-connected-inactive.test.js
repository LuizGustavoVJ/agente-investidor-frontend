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

const ok = (data) => ({ data: { success: true, data } })
const fail = (message) => ({ data: { success: false, message } })

describe('Brokers: syncAll não refresca lista e status connected conta como inativo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('syncAllBrokers com sucesso não recarrega connectedBrokers nem atualiza saldo/posições', async () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      {
        connectionId: 'xp-1',
        status: 'active',
        totalValue: 1000,
        positions: [{ symbol: 'PETR4', quantity: 10 }]
      }
    ]
    brokersAPI.syncAllBrokers.mockResolvedValue(
      ok({ synced: 1, totalValue: 55000, positions: [{ symbol: 'PETR4', quantity: 40 }] })
    )

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(brokersAPI.getConnectedBrokers).not.toHaveBeenCalled()
    expect(store.connectedBrokers[0].totalValue).toBe(1000)
    expect(store.connectedBrokers[0].positions).toEqual([{ symbol: 'PETR4', quantity: 10 }])
    expect(store.lastSync).toBeInstanceOf(Date)
  })

  it('syncAllBrokers com success:false devolve falha sem lançar — a view pode toastar sucesso', async () => {
    const store = useBrokersStore()
    brokersAPI.syncAllBrokers.mockResolvedValue(fail('timeout na XP'))

    const result = await store.syncAllBrokers()

    expect(result).toEqual({ success: false, error: 'timeout na XP' })
    expect(store.error).toBe('timeout na XP')
  })

  it('inactiveBrokers inclui status connected — o getter só trata active como ativo', () => {
    const store = useBrokersStore()
    store.connectedBrokers = [
      { connectionId: 'xp-1', status: 'connected', totalValue: 20000 },
      { connectionId: 'clear-1', status: 'active', totalValue: 5000 }
    ]

    expect(store.activeBrokers).toHaveLength(1)
    expect(store.activeBrokers[0].connectionId).toBe('clear-1')
    expect(store.inactiveBrokers.map((b) => b.connectionId)).toEqual(['xp-1'])
  })

  it('connectBroker de sucesso não remove a corretora de availableBrokers', async () => {
    const store = useBrokersStore()
    store.availableBrokers = [
      { id: 'xp', name: 'XP' },
      { id: 'clear', name: 'Clear' }
    ]
    store.connectedBrokers = []
    brokersAPI.connectBroker.mockResolvedValue(
      ok({ id: 'xp', connectionId: 'xp-1', status: 'active' })
    )

    const result = await store.connectBroker({
      brokerId: 'xp',
      credentials: { token: 'k' },
      accountType: 'pf'
    })

    expect(result.success).toBe(true)
    expect(store.connectedBrokers).toHaveLength(1)
    expect(store.availableBrokers.map((b) => b.id)).toEqual(['xp', 'clear'])
  })
})
