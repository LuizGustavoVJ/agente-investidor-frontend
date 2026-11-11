import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/brokers', () => ({
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

describe('Brokers store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  describe('getters', () => {
    it('separa corretoras ativas, inativas e com erro', () => {
      store.connectedBrokers = [
        { connectionId: 'a', status: 'active', hasErrors: false },
        { connectionId: 'b', status: 'inactive', hasErrors: true },
        { connectionId: 'c', status: 'error', hasErrors: true }
      ]

      expect(store.activeBrokers.map(b => b.connectionId)).toEqual(['a'])
      expect(store.inactiveBrokers.map(b => b.connectionId)).toEqual(['b', 'c'])
      expect(store.brokersWithErrors.map(b => b.connectionId)).toEqual(['b', 'c'])
      expect(store.totalConnectedBrokers).toBe(3)
    })

    it('detecta sincronização em andamento em qualquer corretora', () => {
      store.syncStatus = {
        a: { isRunning: false },
        b: { isRunning: true }
      }

      expect(store.isSyncing).toBe(true)
    })

    it('expõe lastSyncDate como Date e conflitos pendentes', () => {
      store.lastSync = '2026-01-15T12:00:00.000Z'
      store.pendingConflicts = [{ id: 1 }]

      expect(store.lastSyncDate).toBeInstanceOf(Date)
      expect(store.lastSyncDate.toISOString()).toBe('2026-01-15T12:00:00.000Z')
      expect(store.hasPendingConflicts).toBe(true)
    })
  })

  describe('connect / disconnect', () => {
    it('adiciona a corretora conectada ao estado', async () => {
      const connected = { connectionId: 'xp-1', status: 'active' }
      brokersAPI.connectBroker.mockResolvedValue({
        data: { success: true, data: connected }
      })

      const result = await store.connectBroker({ brokerId: 'xp', credentials: { apiKey: 'k' } })

      expect(result.success).toBe(true)
      expect(store.connectedBrokers).toContainEqual(connected)
    })

    it('remove pelo connectionId ao desconectar', async () => {
      store.connectedBrokers = [
        { connectionId: 'xp-1' },
        { connectionId: 'rico-2' }
      ]
      brokersAPI.disconnectBroker.mockResolvedValue({ data: { success: true } })

      const result = await store.disconnectBroker('xp-1')

      expect(result.success).toBe(true)
      expect(store.connectedBrokers).toEqual([{ connectionId: 'rico-2' }])
    })

    it('propaga erro da API sem alterar a lista', async () => {
      store.connectedBrokers = [{ connectionId: 'xp-1' }]
      brokersAPI.disconnectBroker.mockResolvedValue({
        data: { success: false, message: 'Conexão não encontrada' }
      })

      const result = await store.disconnectBroker('xp-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Conexão não encontrada')
      expect(store.connectedBrokers).toHaveLength(1)
    })
  })

  describe('testConnection', () => {
    it('atualiza status da conexão sem ligar o loading global', async () => {
      store.connectedBrokers = [{ connectionId: 'xp-1', connectionStatus: 'unknown' }]
      brokersAPI.testConnection.mockResolvedValue({
        data: { success: true, data: { status: 'ok' } }
      })

      const result = await store.testConnection('xp-1')

      expect(result.success).toBe(true)
      expect(store.connectedBrokers[0].connectionStatus).toBe('ok')
      expect(store.connectedBrokers[0].lastTest).toBeInstanceOf(Date)
      expect(store.isLoading).toBe(false)
    })

    it('não altera corretora inexistente', async () => {
      store.connectedBrokers = []
      brokersAPI.testConnection.mockResolvedValue({
        data: { success: true, data: { status: 'ok' } }
      })

      const result = await store.testConnection('missing')

      expect(result.success).toBe(true)
      expect(store.connectedBrokers).toEqual([])
    })
  })

  describe('syncBroker', () => {
    it('marca sucesso e atualiza lastSync', async () => {
      brokersAPI.syncBroker.mockResolvedValue({
        data: { success: true, data: { imported: 12 } }
      })

      const result = await store.syncBroker('xp-1')

      expect(result.success).toBe(true)
      expect(store.syncStatus['xp-1'].isRunning).toBe(false)
      expect(store.syncStatus['xp-1'].status).toBe('success')
      expect(store.lastSync).toBeInstanceOf(Date)
    })

    it('marca erro e solta isRunning quando a sincronização falha', async () => {
      brokersAPI.syncBroker.mockRejectedValue(new Error('timeout da corretora'))

      const result = await store.syncBroker('xp-1')

      expect(result.success).toBe(false)
      expect(store.syncStatus['xp-1'].isRunning).toBe(false)
      expect(store.syncStatus['xp-1'].status).toBe('error')
      expect(store.syncStatus['xp-1'].error).toBe('timeout da corretora')
      expect(store.isSyncing).toBe(false)
    })
  })

  describe('conflitos e credenciais', () => {
    it('remove o conflito resolvido da fila', async () => {
      store.pendingConflicts = [{ id: 'c1' }, { id: 'c2' }]
      brokersAPI.resolveDataConflict.mockResolvedValue({ data: { success: true } })

      const result = await store.resolveConflict('c1', { strategy: 'keep-local' })

      expect(result.success).toBe(true)
      expect(store.pendingConflicts).toEqual([{ id: 'c2' }])
      expect(brokersAPI.resolveDataConflict).toHaveBeenCalledWith('c1', { strategy: 'keep-local' })
    })

    it('marca credenciais como válidas após atualização', async () => {
      store.connectedBrokers = [{ connectionId: 'xp-1', credentialStatus: 'expired' }]
      brokersAPI.updateCredentials.mockResolvedValue({ data: { success: true } })

      const result = await store.updateCredentials('xp-1', { apiKey: 'nova' })

      expect(result.success).toBe(true)
      expect(store.connectedBrokers[0].credentialStatus).toBe('valid')
      expect(store.connectedBrokers[0].lastCredentialUpdate).toBeInstanceOf(Date)
    })
  })

  describe('clearData', () => {
    it('zera coleções e lastSync, mas preserva o erro atual', () => {
      store.availableBrokers = [{ id: 1 }]
      store.connectedBrokers = [{ connectionId: 'a' }]
      store.syncStatus = { a: { isRunning: true } }
      store.syncHistory = [{ id: 1 }]
      store.pendingConflicts = [{ id: 1 }]
      store.lastSync = new Date()
      store.error = 'falha anterior'

      store.clearData()

      expect(store.availableBrokers).toEqual([])
      expect(store.connectedBrokers).toEqual([])
      expect(store.syncStatus).toEqual({})
      expect(store.syncHistory).toEqual([])
      expect(store.pendingConflicts).toEqual([])
      expect(store.lastSync).toBeNull()
      expect(store.error).toBe('falha anterior')
    })
  })
})
