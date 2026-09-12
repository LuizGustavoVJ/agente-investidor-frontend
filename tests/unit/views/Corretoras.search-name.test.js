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

describe('Corretoras — busca com nome ou accountInfo inválidos', () => {
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

  it('lança TypeError ao buscar se a conexão não tiver name', () => {
    brokersStore.connectedBrokers = [
      { id: 'xp-1', brokerId: 'xp', connectionId: 'c1', status: 'active' }
    ]

    expect(() => {
      wrapper.vm.searchTerm = 'xp'
      return wrapper.vm.filteredConnectedBrokers
    }).toThrow(TypeError)
  })

  it('lança TypeError quando accountInfo é objeto (não string)', () => {
    brokersStore.connectedBrokers = [
      {
        id: 'clear-1',
        name: 'Clear',
        accountInfo: { number: '12345-6' },
        status: 'active'
      }
    ]

    expect(() => {
      wrapper.vm.searchTerm = '12345'
      return wrapper.vm.filteredConnectedBrokers
    }).toThrow(TypeError)
  })
})
