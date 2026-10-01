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

describe('Corretoras — filtro de histórico usa brokerId; o select usa broker.id', () => {
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

    store.connectedBrokers = [{
      id: 'xp',
      connectionId: 'conn-1',
      name: 'XP Investimentos',
      status: 'connected'
    }]
    store.syncHistory = [
      {
        id: 'sync-1',
        connectionId: 'conn-1',
        brokerName: 'XP Investimentos',
        status: 'success',
        assetsSynced: 8,
        timestamp: '2026-10-01T10:00:00.000Z'
      },
      {
        id: 'sync-2',
        connectionId: 'conn-1',
        brokerName: 'XP Investimentos',
        status: 'error',
        assetsSynced: 0,
        timestamp: '2026-09-30T10:00:00.000Z'
      }
    ]
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('filtro "all" mostra o histórico completo', () => {
    wrapper.vm.selectedHistoryFilter = 'all'
    expect(wrapper.vm.filteredSyncHistory).toHaveLength(2)
  })

  it('filtrar pelo id do produto (valor do <select>) esvazia o histórico sem brokerId', () => {
    wrapper.vm.selectedHistoryFilter = 'xp'
    expect(wrapper.vm.filteredSyncHistory).toEqual([])
  })

  it('filtrar pelo connectionId também esvazia porque o computed lê entry.brokerId', () => {
    wrapper.vm.selectedHistoryFilter = 'conn-1'
    expect(wrapper.vm.filteredSyncHistory).toEqual([])
  })
})
