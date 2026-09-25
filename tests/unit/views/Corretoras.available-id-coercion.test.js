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

describe('Corretoras — availableToConnect com id string vs número', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/corretoras', component: { template: '<div />' } }]
    })

    wrapper = mount(Corretoras, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('corretora disponível com id "3" continua listada se a conexão tem id 3', () => {
    brokersStore.connectedBrokers = [
      { id: 3, name: 'XP Investimentos', status: 'active' }
    ]
    brokersStore.availableBrokers = [
      { id: '3', name: 'XP Investimentos' },
      { id: '5', name: 'Clear' }
    ]

    const names = wrapper.vm.availableToConnect.map((broker) => broker.name)
    expect(names).toContain('XP Investimentos')
    expect(names).toContain('Clear')
  })

  it('oculta a corretora quando os ids têm o mesmo tipo', () => {
    brokersStore.connectedBrokers = [
      { id: 3, name: 'XP Investimentos', status: 'active' }
    ]
    brokersStore.availableBrokers = [
      { id: 3, name: 'XP Investimentos' },
      { id: 5, name: 'Clear' }
    ]

    expect(wrapper.vm.availableToConnect.map((broker) => broker.name)).toEqual(['Clear'])
  })
})
