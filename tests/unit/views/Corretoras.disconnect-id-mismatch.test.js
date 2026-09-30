import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getConnectedBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getSyncStatus: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getSyncHistory: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getPendingConflicts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    updateCredentials: vi.fn(),
    resolveDataConflict: vi.fn()
  }
}))

const xpBroker = {
  id: 'xp',
  connectionId: 'conn-1',
  name: 'XP Investimentos',
  status: 'connected',
  assetsCount: 8,
  totalValue: 120000
}

describe('Corretoras — view passa broker.id; store filtra connectionId', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.info.mockReset()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    brokersAPI.disconnectBroker.mockResolvedValue({ data: { success: true } })
    brokersAPI.syncBroker.mockResolvedValue({ data: { success: true, data: { imported: 3 } } })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } },
        { path: '/corretoras/:id', name: 'CorretoraDetalhe', component: { template: '<div />' } }
      ]
    })

    wrapper = mount(Corretoras, {
      global: { plugins: [router] }
    })
    await flushPromises()

    store.connectedBrokers = [{ ...xpBroker }]
  })

  afterEach(() => {
    wrapper?.unmount()
    window.confirm.mockRestore?.()
  })

  it('disconnectBroker chama a API com id do produto e a corretora permanece na lista', async () => {
    await wrapper.vm.disconnectBroker(xpBroker)
    await flushPromises()

    expect(window.confirm).toHaveBeenCalled()
    expect(brokersAPI.disconnectBroker).toHaveBeenCalledWith('xp')
    expect(brokersAPI.disconnectBroker).not.toHaveBeenCalledWith('conn-1')
    expect(store.connectedBrokers).toHaveLength(1)
    expect(store.connectedBrokers[0].connectionId).toBe('conn-1')
    expect(mockToast.success).toHaveBeenCalledWith('XP Investimentos desconectada com sucesso!')
  })

  it('syncBroker grava status em syncStatus.xp, não em syncStatus["conn-1"]', async () => {
    await wrapper.vm.syncBroker(xpBroker)
    await flushPromises()

    expect(brokersAPI.syncBroker).toHaveBeenCalledWith('xp')
    expect(store.syncStatus.xp.status).toBe('success')
    expect(store.syncStatus.xp.isRunning).toBe(false)
    expect(store.syncStatus['conn-1']).toBeUndefined()
    expect(mockToast.success).toHaveBeenCalledWith('XP Investimentos sincronizada com sucesso!')
  })

  it('cancelar o confirm não chama a store nem mostra toast de sucesso', async () => {
    window.confirm.mockReturnValue(false)

    await wrapper.vm.disconnectBroker(xpBroker)
    await flushPromises()

    expect(brokersAPI.disconnectBroker).not.toHaveBeenCalled()
    expect(store.connectedBrokers).toHaveLength(1)
    expect(mockToast.success).not.toHaveBeenCalled()
  })
})
