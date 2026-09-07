import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/corretoras', name: 'Corretoras', component: Corretoras }
  ]
})

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Corretoras — conexão selecionada e filtro por conta', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'connectBroker').mockResolvedValue({ success: true })

    brokersStore.connectedBrokers = [
      { id: 'xp', name: 'XP', accountInfo: 'Conta 1234-5', status: 'active' }
    ]
    brokersStore.availableBrokers = [
      { id: 'xp', name: 'XP' },
      { id: 'clear', name: 'Clear' }
    ]

    wrapper = mount(Corretoras, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    mockToast.success.mockClear()
    mockToast.info.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('não chama connectBroker se nenhuma corretora foi selecionada no modal', async () => {
    wrapper.vm.selectedBrokerToAdd = null
    await wrapper.vm.connectSelectedBroker()
    expect(brokersStore.connectBroker).not.toHaveBeenCalled()
  })

  it('conecta a corretora escolhida no modal e fecha o formulário', async () => {
    wrapper.vm.showAddBrokerModal = true
    wrapper.vm.selectedBrokerToAdd = 'clear'
    await wrapper.vm.connectSelectedBroker()
    await flushPromises()

    expect(brokersStore.connectBroker).toHaveBeenCalledWith('clear')
    expect(wrapper.vm.showAddBrokerModal).toBe(false)
    expect(wrapper.vm.selectedBrokerToAdd).toBeNull()
  })

  it('filtra corretoras conectadas também pelo accountInfo', async () => {
    wrapper.vm.searchTerm = '1234-5'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredConnectedBrokers).toHaveLength(1)
    expect(wrapper.vm.filteredConnectedBrokers[0].name).toBe('XP')

    wrapper.vm.searchTerm = 'inexistente'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredConnectedBrokers).toHaveLength(0)
  })
})
