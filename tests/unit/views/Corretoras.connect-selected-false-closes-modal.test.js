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

describe('Corretoras — connectSelectedBroker fecha o modal mesmo com success:false', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.spyOn(store, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(store, 'connectBroker').mockResolvedValue({
      success: false,
      error: 'Credenciais inválidas'
    })

    store.connectedBrokers = []
    store.availableBrokers = [
      { id: 'clear', name: 'Clear', description: 'Corretora Clear' }
    ]

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
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    mockToast.info.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('toasta sucesso, fecha o modal e não adiciona a corretora quando a store falha', async () => {
    wrapper.vm.showAddBrokerModal = true
    wrapper.vm.selectedBrokerToAdd = 'clear'

    await wrapper.vm.connectSelectedBroker()
    await flushPromises()

    expect(store.connectBroker).toHaveBeenCalledWith('clear')
    expect(mockToast.info).toHaveBeenCalledWith('Conectando Clear...')
    expect(mockToast.success).toHaveBeenCalledWith('Clear conectada com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalled()
    expect(wrapper.vm.showAddBrokerModal).toBe(false)
    expect(wrapper.vm.selectedBrokerToAdd).toBeNull()
    expect(store.connectedBrokers).toHaveLength(0)
    expect(wrapper.vm.availableToConnect.some((broker) => broker.id === 'clear')).toBe(true)
  })
})
