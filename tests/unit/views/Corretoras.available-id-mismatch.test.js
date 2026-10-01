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

describe('Corretoras — availableToConnect compara available.id com connected.id', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } }]
    })

    wrapper = mount(Corretoras, {
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('corretora já conectada por connectionId/brokerId reaparece como disponível', () => {
    store.connectedBrokers = [{
      id: 'conn-1',
      connectionId: 'conn-1',
      brokerId: 'xp',
      name: 'XP Investimentos',
      status: 'connected'
    }]
    store.availableBrokers = [{
      id: 'xp',
      brokerId: 'xp',
      name: 'XP Investimentos'
    }]

    const available = wrapper.vm.availableToConnect
    expect(available).toHaveLength(1)
    expect(available[0].id).toBe('xp')
  })

  it('quando connected.id já é o id do produto, a corretora some da lista', () => {
    store.connectedBrokers = [{
      id: 'xp',
      connectionId: 'conn-1',
      brokerId: 'xp',
      name: 'XP Investimentos',
      status: 'connected'
    }]
    store.availableBrokers = [{
      id: 'xp',
      name: 'XP Investimentos'
    }]

    expect(wrapper.vm.availableToConnect).toHaveLength(0)
  })
})
