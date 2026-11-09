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

const apiSuccess = (data) => ({ data: { success: true, data } })
const apiFailure = (message) => ({ data: { success: false, message } })

describe('Brokers Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  describe('Getters de status e risco', () => {
    it('separa corretoras ativas, inativas e com erro', () => {
      store.connectedBrokers = [
        { connectionId: '1', status: 'active', hasErrors: false },
        { connectionId: '2', status: 'inactive', hasErrors: true },
        { connectionId: '3', status: 'active', hasErrors: true }
      ]

      expect(store.activeBrokers).toHaveLength(2)
      expect(store.inactiveBrokers).toEqual([
        expect.objectContaining({ connectionId: '2' })
      ])
      expect(store.brokersWithErrors.map(b => b.connectionId)).toEqual(['2', '3'])
      expect(store.totalConnectedBrokers).toBe(3)
    })

    it('detecta sincronização em andamento', () => {
      store.syncStatus = {
        xp: { isRunning: false },
        clear: { isRunning: true }
      }

      expect(store.isSyncing).toBe(true)
    })

    it('não marca como sincronizando quando nenhuma sync está rodando', () => {
      store.syncStatus = { xp: { isRunning: false } }

      expect(store.isSyncing).toBe(false)
    })

    it('expõe conflitos pendentes e data da última sync', () => {
      store.pendingConflicts = [{ id: 'c1' }]
      store.lastSync = '2026-01-15T12:00:00.000Z'

      expect(store.hasPendingConflicts).toBe(true)
      expect(store.lastSyncDate).toEqual(new Date('2026-01-15T12:00:00.000Z'))
    })
  })

  describe('Conexão e credenciais', () => {
    it('adiciona corretora conectada após sucesso da API', async () => {
      const broker = { connectionId: 'xp-1', name: 'XP' }
      brokersAPI.connectBroker.mockResolvedValue(apiSuccess(broker))

      const result = await store.connectBroker({
        brokerId: 'xp',
        credentials: { token: 'secret' },
        accountType: 'real'
      })

      expect(result).toEqual({ success: true, data: broker })
      expect(store.connectedBrokers).toContainEqual(broker)
      expect(store.isLoading).toBe(false)
    })

    it('retorna erro de negócio quando a API recusa a conexão', async () => {
      brokersAPI.connectBroker.mockResolvedValue(apiFailure('Credenciais inválidas'))

      const result = await store.connectBroker({ brokerId: 'xp' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Credenciais inválidas')
      expect(store.connectedBrokers).toHaveLength(0)
    })

    it('remove corretora da lista ao desconectar', async () => {
      store.connectedBrokers = [
        { connectionId: 'xp-1' },
        { connectionId: 'clear-1' }
      ]
      brokersAPI.disconnectBroker.mockResolvedValue(apiSuccess({}))

      const result = await store.disconnectBroker('xp-1')

      expect(result.success).toBe(true)
      expect(store.connectedBrokers).toEqual([{ connectionId: 'clear-1' }])
    })

    it('marca credenciais como válidas após atualização', async () => {
      store.connectedBrokers = [{ connectionId: 'xp-1', credentialStatus: 'expired' }]
      brokersAPI.updateCredentials.mockResolvedValue(apiSuccess({}))

      const result = await store.updateCredentials('xp-1', { token: 'novo' })

      expect(result.success).toBe(true)
      expect(store.connectedBrokers[0].credentialStatus).toBe('valid')
      expect(store.connectedBrokers[0].lastCredentialUpdate).toBeInstanceOf(Date)
    })

    it('propaga mensagem do backend em falha de credenciais', async () => {
      brokersAPI.updateCredentials.mockRejectedValue({
        response: { data: { message: 'Token expirado' } }
      })

      const result = await store.updateCredentials('xp-1', { token: 'x' })

      expect(result).toEqual({ success: false, error: 'Token expirado' })
      expect(store.error).toBe('Token expirado')
    })
  })

  describe('Sincronização', () => {
    it('marca sync como sucesso e atualiza lastSync', async () => {
      brokersAPI.syncBroker.mockResolvedValue(apiSuccess({ imported: 12 }))

      const result = await store.syncBroker('xp-1')

      expect(result.success).toBe(true)
      expect(store.syncStatus['xp-1'].isRunning).toBe(false)
      expect(store.syncStatus['xp-1'].status).toBe('success')
      expect(store.lastSync).toBeInstanceOf(Date)
    })

    it('marca sync como erro sem deixar isRunning preso', async () => {
      brokersAPI.syncBroker.mockRejectedValue(new Error('timeout'))

      const result = await store.syncBroker('xp-1')

      expect(result.success).toBe(false)
      expect(store.syncStatus['xp-1'].isRunning).toBe(false)
      expect(store.syncStatus['xp-1'].status).toBe('error')
      expect(store.syncStatus['xp-1'].error).toBe('timeout')
    })

    it('atualiza status de conexão após teste bem-sucedido', async () => {
      store.connectedBrokers = [{ connectionId: 'xp-1', connectionStatus: 'unknown' }]
      brokersAPI.testConnection.mockResolvedValue(apiSuccess({ status: 'online' }))

      const result = await store.testConnection('xp-1')

      expect(result.success).toBe(true)
      expect(store.connectedBrokers[0].connectionStatus).toBe('online')
      expect(store.connectedBrokers[0].lastTest).toBeInstanceOf(Date)
    })
  })

  describe('Conflitos de dados', () => {
    it('carrega conflitos pendentes', async () => {
      const conflicts = [{ id: 'c1', field: 'quantity' }]
      brokersAPI.getPendingConflicts.mockResolvedValue(apiSuccess(conflicts))

      const result = await store.fetchPendingConflicts()

      expect(result.success).toBe(true)
      expect(store.pendingConflicts).toEqual(conflicts)
    })

    it('remove conflito resolvido da fila', async () => {
      store.pendingConflicts = [{ id: 'c1' }, { id: 'c2' }]
      brokersAPI.resolveDataConflict.mockResolvedValue(apiSuccess({}))

      const result = await store.resolveConflict('c1', { keep: 'broker' })

      expect(result.success).toBe(true)
      expect(store.pendingConflicts).toEqual([{ id: 'c2' }])
    })

    it('não remove conflito quando o id é número e a action recebe string', async () => {
      store.pendingConflicts = [{ id: 7, field: 'quantity' }]
      brokersAPI.resolveDataConflict.mockResolvedValue(apiSuccess({}))

      const result = await store.resolveConflict('7', { keep: 'local' })

      expect(result.success).toBe(true)
      expect(store.pendingConflicts).toHaveLength(1)
    })
  })

  describe('Limpeza de estado', () => {
    it('clearData zera listas e status de sync', () => {
      store.availableBrokers = [{ id: 1 }]
      store.connectedBrokers = [{ id: 1 }]
      store.syncStatus = { xp: { isRunning: true } }
      store.pendingConflicts = [{ id: 'c1' }]
      store.lastSync = new Date()

      store.clearData()

      expect(store.availableBrokers).toEqual([])
      expect(store.connectedBrokers).toEqual([])
      expect(store.syncStatus).toEqual({})
      expect(store.pendingConflicts).toEqual([])
      expect(store.lastSync).toBeNull()
    })
  })
})
