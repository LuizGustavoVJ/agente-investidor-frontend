import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Corretoras — status, identidade e payload de conexão', () => {
  let wrapper
  let pinia
  let router
  let brokersStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    toast.success.mockClear()
    toast.error.mockClear()
    toast.info.mockClear()

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/corretoras', component: { template: '<div />' } },
        { path: '/corretoras/:id', component: { template: '<div />' } },
        { path: '/corretoras/:id/configuracao', component: { template: '<div />' } }
      ]
    })
    await router.push('/corretoras')
    await router.isReady()

    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'connectBroker').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'syncBroker').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'disconnectBroker').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'syncAllBrokers').mockResolvedValue({ success: true })

    wrapper = mount(Corretoras, {
      global: { plugins: [pinia, router] }
    })
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('status active da store não mapeia para connected na view', () => {
    expect(wrapper.vm.getBrokerStatusClass('active')).toBe('unknown')
    expect(wrapper.vm.getBrokerStatusText('active')).toBe('Desconhecido')
    expect(wrapper.vm.getBrokerStatusClass('connected')).toBe('connected')
  })

  it('connectBroker envia o id primitivo, não o contrato { brokerId, credentials }', async () => {
    await wrapper.vm.connectBroker({ id: 7, name: 'XP' })
    expect(brokersStore.connectBroker).toHaveBeenCalledWith(7)
  })

  it('syncBroker e disconnectBroker usam broker.id em vez de connectionId', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const broker = { id: 3, connectionId: 'conn-9', name: 'Clear' }

    await wrapper.vm.syncBroker(broker)
    expect(brokersStore.syncBroker).toHaveBeenCalledWith(3)

    await wrapper.vm.disconnectBroker(broker)
    expect(brokersStore.disconnectBroker).toHaveBeenCalledWith(3)
  })

  it('availableToConnect compara b.id, então connectionId diferente não esconde a corretora', async () => {
    brokersStore.connectedBrokers = [{ id: 99, connectionId: 1, name: 'XP' }]
    brokersStore.availableBrokers = [
      { id: 1, name: 'XP' },
      { id: 2, name: 'Clear' }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.availableToConnect.map(b => b.id)).toEqual([1, 2])
  })

  it('totalSyncedAssets cai em 0 porque a store não expõe a propriedade', () => {
    expect(brokersStore.totalSyncedAssets).toBeUndefined()
    expect(wrapper.vm.totalSyncedAssets).toBe(0)
  })

  it('busca em corretora sem name lança TypeError', () => {
    brokersStore.connectedBrokers = [{ id: 1, accountInfo: 'CC 123' }]
    wrapper.vm.searchTerm = 'xp'
    expect(() => wrapper.vm.filteredConnectedBrokers).toThrow()
  })
})
