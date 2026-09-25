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

describe('Corretoras — filtro de histórico com id string vs número', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    brokersStore.connectedBrokers = [
      { id: 3, name: 'XP Investimentos', status: 'active' }
    ]
    brokersStore.syncHistory = [
      { id: 1, brokerId: '3', status: 'success' },
      { id: 2, brokerId: 3, status: 'error' }
    ]

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

  it('select com id numérico 3 não mostra entrada cujo brokerId é "3"', () => {
    wrapper.vm.selectedHistoryFilter = 3

    expect(wrapper.vm.filteredSyncHistory).toEqual([
      { id: 2, brokerId: 3, status: 'error' }
    ])
  })

  it('select com id string "3" (valor de <option>) não mostra entrada numérica', () => {
    wrapper.vm.selectedHistoryFilter = '3'

    expect(wrapper.vm.filteredSyncHistory).toEqual([
      { id: 1, brokerId: '3', status: 'success' }
    ])
  })
})
