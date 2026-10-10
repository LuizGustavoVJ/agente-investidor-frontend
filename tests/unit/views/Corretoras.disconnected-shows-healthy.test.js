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

describe('Corretoras — desconectada ainda conta como saudável', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } }]
    })
    await router.push('/corretoras')
    await router.isReady()

    wrapper = mount(Corretoras, {
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('lista com connected + disconnected mostra Conectado / Todas funcionando', async () => {
    brokersStore.connectedBrokers = [
      { id: 1, name: 'XP', status: 'connected', accountInfo: '123' },
      { id: 2, name: 'Clear', status: 'disconnected', accountInfo: '456' }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.connectedBrokers).toHaveLength(2)
    expect(wrapper.vm.getOverallStatusText()).toBe('Conectado')
    expect(wrapper.vm.getOverallStatusClass()).toBe('connected')
    expect(wrapper.vm.getOverallStatusDescription()).toBe('Todas as corretoras funcionando')
    expect(wrapper.vm.getOverallStatusIcon()).toBe('✅')
  })

  it('só corretoras disconnected ainda nascem no card verde', async () => {
    brokersStore.connectedBrokers = [
      { id: 9, name: 'Rico', status: 'disconnected' }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.getOverallStatusText()).toBe('Conectado')
    expect(wrapper.vm.getOverallStatusClass()).toBe('connected')
    expect(wrapper.find('.card-value.status.connected').exists()).toBe(true)
  })
})
