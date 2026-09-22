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

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } }
  ]
})

describe('Corretoras — status active da store vs id de conexão', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    wrapper = mount(Corretoras, {
      global: { plugins: [router] }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('status "active" da store aparece como Desconhecido na view', () => {
    expect(wrapper.vm.getBrokerStatusClass('active')).toBe('unknown')
    expect(wrapper.vm.getBrokerStatusText('active')).toBe('Desconhecido')
  })

  it('corretora conectada só com connectionId continua na lista para reconectar', async () => {
    brokersStore.availableBrokers = [
      { id: 'xp', name: 'XP' },
      { id: 'rico', name: 'Rico' }
    ]
    brokersStore.connectedBrokers = [
      { connectionId: 'conn-xp', brokerId: 'xp', name: 'XP', status: 'active' }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.availableToConnect.map((b) => b.id)).toEqual(['xp', 'rico'])
  })

  it('busca lança se a corretora conectada não tem name', async () => {
    brokersStore.connectedBrokers = [
      { id: 'xp', accountInfo: 'Conta 1', status: 'connected' }
    ]
    wrapper.vm.searchTerm = 'xp'
    await wrapper.vm.$nextTick()

    expect(() => wrapper.vm.filteredConnectedBrokers).toThrow()
  })
})
