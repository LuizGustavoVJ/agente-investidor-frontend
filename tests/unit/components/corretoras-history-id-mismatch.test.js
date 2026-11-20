import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getConnectedBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getSyncStatus: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getPendingConflicts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    connectBroker: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    disconnectBroker: vi.fn()
  }
}))

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Corretoras: identidade de IDs no histórico e status', () => {
  let wrapper
  let store

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]
    })
    wrapper = mount(Corretoras, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()
    store = useBrokersStore()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('filteredSyncHistory compara brokerId, não connectionId', () => {
    store.syncHistory = [
      { id: 1, brokerId: 'xp', connectionId: 'c-1' },
      { id: 2, brokerId: 'clear', connectionId: 'xp' }
    ]
    wrapper.vm.selectedHistoryFilter = 'xp'

    expect(wrapper.vm.filteredSyncHistory.map(e => e.id)).toEqual([1])
  })

  it('availableToConnect usa id e reexibe corretora já conectada por connectionId', () => {
    store.connectedBrokers = [{ id: 'conn-9', connectionId: 'xp', name: 'XP' }]
    store.availableBrokers = [
      { id: 'xp', name: 'XP' },
      { id: 'clear', name: 'Clear' }
    ]

    expect(wrapper.vm.availableToConnect.map(b => b.id)).toEqual(['xp', 'clear'])
  })

  it('getBrokerStatusClass trata active da store como unknown', () => {
    expect(wrapper.vm.getBrokerStatusClass('active')).toBe('unknown')
    expect(wrapper.vm.getBrokerStatusClass('connected')).toBe('connected')
    expect(wrapper.vm.getBrokerStatusText('active')).toBe('Desconhecido')
  })

  it('connectBroker envia o id primitivo, não o payload de credenciais', async () => {
    store.connectBroker = vi.fn().mockResolvedValue({ success: true })
    const broker = { id: 'xp', name: 'XP Investimentos' }

    await wrapper.vm.connectBroker(broker)

    expect(store.connectBroker).toHaveBeenCalledWith('xp')
  })

  it('busca em corretora sem name lança TypeError', () => {
    store.connectedBrokers = [{ id: 1, accountInfo: 'conta' }]
    wrapper.vm.searchTerm = 'xp'

    expect(() => wrapper.vm.filteredConnectedBrokers).toThrow()
  })

  it('totalSyncedAssets cai em 0 porque a store não expõe o campo', () => {
    store.connectedBrokers = [{ id: 1, syncedAssets: 40 }]
    expect(wrapper.vm.totalSyncedAssets).toBe(0)
  })
})
