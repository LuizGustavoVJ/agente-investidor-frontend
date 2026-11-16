import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { brokersAPI } = vi.hoisted(() => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getSyncHistory: vi.fn(),
    getPendingConflicts: vi.fn(),
    resolveDataConflict: vi.fn(),
    updateCredentials: vi.fn()
  }
}))

vi.mock('@/api/brokers', () => ({ brokersAPI }))

import { useBrokersStore } from '@/stores/brokers'

describe('Brokers store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  describe('getters', () => {
    it('separa ativas, inativas e corretoras com erro', () => {
      store.connectedBrokers = [
        { connectionId: 'a', status: 'active', hasErrors: false },
        { connectionId: 'b', status: 'paused', hasErrors: true },
        { connectionId: 'c', status: 'active', hasErrors: true }
      ]

      expect(store.activeBrokers.map((b) => b.connectionId)).toEqual(['a', 'c'])
      expect(store.inactiveBrokers.map((b) => b.connectionId)).toEqual(['b'])
      expect(store.brokersWithErrors.map((b) => b.connectionId)).toEqual(['b', 'c'])
      expect(store.totalConnectedBrokers).toBe(3)
    })

    it('isSyncing ignora status sem isRunning e lastSyncDate é nulo sem lastSync', () => {
      store.syncStatus = {
        a: { isRunning: false },
        b: {},
        c: { isRunning: true }
      }

      expect(store.isSyncing).toBe(true)
      expect(store.lastSyncDate).toBeNull()
      expect(store.hasPendingConflicts).toBe(false)
    })
  })

  describe('connect / disconnect', () => {
    it('adiciona a corretora conectada ao estado', async () => {
      brokersAPI.connectBroker.mockResolvedValue({
        data: {
          success: true,
          data: { connectionId: 'xp-1', status: 'active' }
        }
      })

      const result = await store.connectBroker({
        brokerId: 'xp',
        credentials: { apiKey: 'k' }
      })

      expect(result.success).toBe(true)
      expect(store.connectedBrokers).toHaveLength(1)
      expect(store.connectedBrokers[0].connectionId).toBe('xp-1')
    })

    it('remove pelo connectionId e não pelo id interno', async () => {
      store.connectedBrokers = [
        { id: 1, connectionId: 'keep' },
        { id: 2, connectionId: 'drop' }
      ]
      brokersAPI.disconnectBroker.mockResolvedValue({ data: { success: true } })

      await store.disconnectBroker('drop')

      expect(store.connectedBrokers).toEqual([{ id: 1, connectionId: 'keep' }])
    })

    it('não altera a lista se a API recusar o disconnect', async () => {
      store.connectedBrokers = [{ connectionId: 'xp-1' }]
      brokersAPI.disconnectBroker.mockResolvedValue({
        data: { success: false, message: 'ainda sincronizando' }
      })

      const result = await store.disconnectBroker('xp-1')

      expect(result.success).toBe(false)
      expect(store.connectedBrokers).toHaveLength(1)
      expect(store.error).toBe('ainda sincronizando')
    })
  })

  describe('syncBroker', () => {
    it('marca isRunning durante a chamada e limpa em caso de erro', async () => {
      let runningDuringCall = false
      brokersAPI.syncBroker.mockImplementation(async () => {
        runningDuringCall = store.syncStatus['xp-1'].isRunning
        throw new Error('timeout da corretora')
      })

      const result = await store.syncBroker('xp-1')

      expect(runningDuringCall).toBe(true)
      expect(result.success).toBe(false)
      expect(store.syncStatus['xp-1'].isRunning).toBe(false)
      expect(store.syncStatus['xp-1'].status).toBe('error')
      expect(store.isSyncing).toBe(false)
    })

    it('grava lastSync só após sucesso', async () => {
      brokersAPI.syncBroker.mockResolvedValue({
        data: { success: true, data: { imported: 12 } }
      })

      const result = await store.syncBroker('xp-1')

      expect(result.success).toBe(true)
      expect(store.syncStatus['xp-1'].status).toBe('success')
      expect(store.lastSync).toBeInstanceOf(Date)
      expect(store.lastSyncDate).toBeInstanceOf(Date)
    })
  })

  describe('conflitos e credenciais', () => {
    it('resolve conflito removendo só o id pedido, inclusive com id numérico vs string', async () => {
      store.pendingConflicts = [
        { id: 10, symbol: 'PETR4' },
        { id: '11', symbol: 'VALE3' }
      ]
      brokersAPI.resolveDataConflict.mockResolvedValue({ data: { success: true } })

      await store.resolveConflict(10, { strategy: 'keep-local' })

      expect(store.pendingConflicts).toEqual([{ id: '11', symbol: 'VALE3' }])
      expect(store.hasPendingConflicts).toBe(true)

      await store.resolveConflict('11', { strategy: 'keep-remote' })
      expect(store.hasPendingConflicts).toBe(false)
    })

    it('updateCredentials não quebra se a conexão não estiver no estado', async () => {
      brokersAPI.updateCredentials.mockResolvedValue({ data: { success: true } })

      const result = await store.updateCredentials('missing', { apiKey: 'n' })

      expect(result.success).toBe(true)
      expect(store.connectedBrokers).toEqual([])
    })
  })

  describe('loadAllData e clearData', () => {
    it('retorna success mesmo quando um fetch interno falha, porque as actions não relançam', async () => {
      brokersAPI.getAvailableBrokers.mockResolvedValue({
        data: { success: false, message: 'serviço indisponível' }
      })
      brokersAPI.getConnectedBrokers.mockResolvedValue({
        data: { success: true, data: [] }
      })
      brokersAPI.getSyncStatus.mockResolvedValue({
        data: { success: true, data: {} }
      })
      brokersAPI.getPendingConflicts.mockResolvedValue({
        data: { success: true, data: [] }
      })

      const result = await store.loadAllData()

      expect(result.success).toBe(true)
      expect(store.error).toBe('serviço indisponível')
    })

    it('clearData não zera error nem isLoading', () => {
      store.connectedBrokers = [{ connectionId: 'x' }]
      store.error = 'falha'
      store.isLoading = true
      store.lastSync = new Date()

      store.clearData()

      expect(store.connectedBrokers).toEqual([])
      expect(store.lastSync).toBeNull()
      expect(store.error).toBe('falha')
      expect(store.isLoading).toBe(true)
    })
  })
})
