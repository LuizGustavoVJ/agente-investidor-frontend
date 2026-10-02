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

describe('Corretoras — status geral ignora hasErrors e connectionStatus', () => {
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

  it('corretora active com hasErrors e connectionStatus error aparece como saudável', async () => {
    brokersStore.connectedBrokers = [
      {
        id: 'conn-xp',
        brokerId: 'xp',
        name: 'XP',
        status: 'active',
        hasErrors: true,
        connectionStatus: 'error',
        assetsCount: 12
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.getOverallStatusText()).toBe('Conectado')
    expect(wrapper.vm.getOverallStatusClass()).toBe('connected')
    expect(wrapper.vm.getOverallStatusIcon()).toBe('✅')
    expect(wrapper.vm.getOverallStatusDescription()).toBe('Todas as corretoras funcionando')
  })

  it('status connected com connectionStatus error também mente o card geral', async () => {
    brokersStore.connectedBrokers = [
      {
        id: 'conn-rico',
        brokerId: 'rico',
        name: 'Rico',
        status: 'connected',
        hasErrors: false,
        connectionStatus: 'error'
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.getOverallStatusText()).toBe('Conectado')
    expect(wrapper.vm.getOverallStatusDescription()).toBe('Todas as corretoras funcionando')
  })
})
