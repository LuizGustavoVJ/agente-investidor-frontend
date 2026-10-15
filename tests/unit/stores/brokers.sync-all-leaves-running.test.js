import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    syncAllBrokers: vi.fn(),
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn()
  }
}))

describe('brokers store — syncAllBrokers deixa isRunning=true após sucesso', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  it('sucesso da API marca activeBrokers como isRunning e isSyncing permanece true', async () => {
    store.connectedBrokers = [
      { id: 'xp-1', connectionId: 'conn-xp', name: 'XP', status: 'active' },
      { id: 'clear-1', connectionId: 'conn-clear', name: 'Clear', status: 'error' }
    ]

    brokersAPI.syncAllBrokers.mockResolvedValue({
      data: { success: true, data: { synced: 1 } }
    })

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(store.syncStatus['conn-xp'].isRunning).toBe(true)
    expect(store.syncStatus['conn-xp'].status).not.toBe('success')
    expect(store.syncStatus['conn-clear']).toBeUndefined()
    expect(store.isSyncing).toBe(true)
    expect(store.lastSync).toBeInstanceOf(Date)
  })

  it('success:false não liga isRunning — só o caminho de sucesso prende o indicador', async () => {
    store.connectedBrokers = [
      { id: 'xp-1', connectionId: 'conn-xp', name: 'XP', status: 'active' }
    ]

    brokersAPI.syncAllBrokers.mockResolvedValue({
      data: { success: false, message: 'Nenhuma corretora ativa' }
    })

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(false)
    expect(store.syncStatus['conn-xp']).toBeUndefined()
    expect(store.isSyncing).toBe(false)
    expect(store.lastSync).toBeNull()
  })
})
