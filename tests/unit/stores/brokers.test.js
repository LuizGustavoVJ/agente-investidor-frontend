import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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

import { brokersAPI } from '@/api/brokers'
import { useBrokersStore } from '@/stores/brokers'

const success = (data) => ({ data: { success: true, data } })
const failure = (message, status = 400) => {
  const error = new Error(message)
  error.response = { data: { message }, status }
  return error
}

describe('Brokers Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
  })

  describe('Getters', () => {
    it('separa corretoras ativas, inativas e com erro', () => {
      store.connectedBrokers = [
        { connectionId: '1', status: 'active', hasErrors: false },
        { connectionId: '2', status: 'paused', hasErrors: false },
        { connectionId: '3', status: 'active', hasErrors: true }
      ]

      expect(store.activeBrokers).toHaveLength(2)
      expect(store.inactiveBrokers).toEqual([
        { connectionId: '2', status: 'paused', hasErrors: false }
      ])
      expect(store.brokersWithErrors).toEqual([
        { connectionId: '3', status: 'active', hasErrors: true }
      ])
      expect(store.totalConnectedBrokers).toBe(3)
    })

    it('detecta sincronização em andamento e conflitos pendentes', () => {
      store.syncStatus = {
        a: { isRunning: false },
        b: { isRunning: true }
      }
      store.pendingConflicts = [{ id: 'c1' }]

      expect(store.isSyncing).toBe(true)
      expect(store.hasPendingConflicts).toBe(true)
    })

    it('converte lastSync em Date e retorna null quando vazio', () => {
      expect(store.lastSyncDate).toBeNull()

      const iso = '2026-09-01T10:00:00.000Z'
      store.lastSync = iso

      expect(store.lastSyncDate).toEqual(new Date(iso))
    })
  })

  describe('Conectar e desconectar', () => {
    it('adiciona corretora conectada em caso de sucesso', async () => {
      const broker = { connectionId: 'xp-1', status: 'active' }
      brokersAPI.connectBroker.mockResolvedValue(success(broker))

      const result = await store.connectBroker({
        brokerId: 'xp',
        credentials: { token: 'secret' },
        accountType: 'checking'
      })

      expect(result).toEqual({ success: true, data: broker })
      expect(store.connectedBrokers).toEqual([broker])
      expect(store.isLoading).toBe(false)
    })

    it('expõe mensagem da API quando a conexão falha', async () => {
      brokersAPI.connectBroker.mockRejectedValue(failure('Credenciais inválidas'))

      const result = await store.connectBroker({ brokerId: 'xp' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Credenciais inválidas')
      expect(store.error).toBe('Credenciais inválidas')
      expect(store.connectedBrokers).toEqual([])
    })

    it('remove apenas a conexão desconectada', async () => {
      store.connectedBrokers = [
        { connectionId: 'xp-1' },
        { connectionId: 'rico-2' }
      ]
      brokersAPI.disconnectBroker.mockResolvedValue(success(null))

      const result = await store.disconnectBroker('xp-1')

      expect(result.success).toBe(true)
      expect(store.connectedBrokers).toEqual([{ connectionId: 'rico-2' }])
    })

    it('não remove conexão se a API recusar o disconnect', async () => {
      store.connectedBrokers = [{ connectionId: 'xp-1' }]
      brokersAPI.disconnectBroker.mockResolvedValue({
        data: { success: false, message: 'Conexão em uso' }
      })

      const result = await store.disconnectBroker('xp-1')

      expect(result.success).toBe(false)
      expect(store.connectedBrokers).toEqual([{ connectionId: 'xp-1' }])
    })
  })

  describe('Sincronização', () => {
    it('marca status de sucesso e atualiza lastSync', async () => {
      brokersAPI.syncBroker.mockResolvedValue(success({ imported: 12 }))

      const result = await store.syncBroker('xp-1')

      expect(result.success).toBe(true)
      expect(store.syncStatus['xp-1'].isRunning).toBe(false)
      expect(store.syncStatus['xp-1'].status).toBe('success')
      expect(store.lastSync).toBeInstanceOf(Date)
    })

    it('marca status de erro e libera isRunning quando a sync falha', async () => {
      brokersAPI.syncBroker.mockRejectedValue(new Error('Timeout da corretora'))

      const result = await store.syncBroker('xp-1')

      expect(result.success).toBe(false)
      expect(store.syncStatus['xp-1'].isRunning).toBe(false)
      expect(store.syncStatus['xp-1'].status).toBe('error')
      expect(store.syncStatus['xp-1'].error).toBe('Timeout da corretora')
      expect(store.isSyncing).toBe(false)
    })

    it('atualiza connectionStatus após testConnection bem-sucedido', async () => {
      store.connectedBrokers = [{ connectionId: 'xp-1', connectionStatus: 'unknown' }]
      brokersAPI.testConnection.mockResolvedValue(success({ status: 'healthy' }))

      const result = await store.testConnection('xp-1')

      expect(result.success).toBe(true)
      expect(store.connectedBrokers[0].connectionStatus).toBe('healthy')
      expect(store.connectedBrokers[0].lastTest).toBeInstanceOf(Date)
    })
  })

  describe('Conflitos e credenciais', () => {
    it('remove conflito resolvido da lista pendente', async () => {
      store.pendingConflicts = [{ id: 'c1' }, { id: 'c2' }]
      brokersAPI.resolveDataConflict.mockResolvedValue(success(null))

      const result = await store.resolveConflict('c1', { action: 'keep_local' })

      expect(result.success).toBe(true)
      expect(store.pendingConflicts).toEqual([{ id: 'c2' }])
      expect(store.hasPendingConflicts).toBe(true)
    })

    it('marca credenciais como válidas após atualização', async () => {
      store.connectedBrokers = [{ connectionId: 'xp-1', credentialStatus: 'expired' }]
      brokersAPI.updateCredentials.mockResolvedValue(success(null))

      const result = await store.updateCredentials('xp-1', { token: 'novo' })

      expect(result.success).toBe(true)
      expect(store.connectedBrokers[0].credentialStatus).toBe('valid')
      expect(store.connectedBrokers[0].lastCredentialUpdate).toBeInstanceOf(Date)
    })
  })

  describe('Carga e limpeza', () => {
    it('carrega corretoras disponíveis e conectadas', async () => {
      brokersAPI.getAvailableBrokers.mockResolvedValue(success([{ id: 'xp' }]))
      brokersAPI.getConnectedBrokers.mockResolvedValue(success([{ connectionId: 'xp-1' }]))

      await store.fetchAvailableBrokers()
      await store.fetchConnectedBrokers()

      expect(store.availableBrokers).toEqual([{ id: 'xp' }])
      expect(store.connectedBrokers).toEqual([{ connectionId: 'xp-1' }])
    })

    it('limpa estado sensível em clearData sem perder a API da store', () => {
      store.availableBrokers = [{ id: 'xp' }]
      store.connectedBrokers = [{ connectionId: 'xp-1' }]
      store.syncStatus = { 'xp-1': { isRunning: true } }
      store.syncHistory = [{ id: 1 }]
      store.pendingConflicts = [{ id: 'c1' }]
      store.lastSync = new Date()
      store.error = 'falha'

      store.clearData()
      store.clearError()

      expect(store.availableBrokers).toEqual([])
      expect(store.connectedBrokers).toEqual([])
      expect(store.syncStatus).toEqual({})
      expect(store.pendingConflicts).toEqual([])
      expect(store.lastSync).toBeNull()
      expect(store.error).toBeNull()
    })
  })
})
