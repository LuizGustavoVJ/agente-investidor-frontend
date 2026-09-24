import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

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

describe('Corretoras — connectSelectedBroker com id string vs número', () => {
  let wrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.info.mockReset()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } },
        { path: '/corretoras/:id', component: { template: '<div />' } }
      ]
    })

    wrapper = mount(Corretoras, {
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('selectedBrokerToAdd "3" não encontra corretora com id numérico 3', async () => {
    const store = useBrokersStore()
    store.availableBrokers = [
      { id: 3, name: 'XP Investimentos' }
    ]
    store.connectedBrokers = []
    store.connectBroker = vi.fn()

    wrapper.vm.selectedBrokerToAdd = '3'
    await wrapper.vm.connectSelectedBroker()
    await flushPromises()

    expect(store.connectBroker).not.toHaveBeenCalled()
    expect(mockToast.info).not.toHaveBeenCalled()
  })

  it('selectedBrokerToAdd 3 (número) encontra e tenta conectar', async () => {
    const store = useBrokersStore()
    store.availableBrokers = [
      { id: 3, name: 'XP Investimentos' }
    ]
    store.connectedBrokers = []
    store.connectBroker = vi.fn().mockResolvedValue({ success: true })

    wrapper.vm.selectedBrokerToAdd = 3
    await wrapper.vm.connectSelectedBroker()
    await flushPromises()

    expect(store.connectBroker).toHaveBeenCalled()
  })
})
