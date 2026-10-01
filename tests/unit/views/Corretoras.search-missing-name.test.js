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

describe('Corretoras — busca chama name.toLowerCase() sem guard', () => {
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

    store.connectedBrokers = [
      { id: 'xp', name: 'XP Investimentos', accountInfo: 'Conta 1', status: 'connected' },
      { id: 'btg', name: null, accountInfo: 'Conta 2', status: 'connected' },
      { id: 'rico', accountInfo: 'Conta 3', status: 'connected' }
    ]
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('sem termo de busca ainda lista corretoras sem nome', () => {
    wrapper.vm.searchTerm = ''
    expect(wrapper.vm.filteredConnectedBrokers).toHaveLength(3)
  })

  it('buscar qualquer termo derruba a lista quando name é null ou ausente', () => {
    wrapper.vm.searchTerm = 'xp'
    expect(() => wrapper.vm.filteredConnectedBrokers).toThrow(TypeError)
  })
})
