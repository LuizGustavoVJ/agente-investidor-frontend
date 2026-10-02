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

describe('Corretoras — busca com accountInfo numérico', () => {
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

  it('accountInfo número derruba a busca quando o termo não casa com o nome', async () => {
    brokersStore.connectedBrokers = [
      { id: 'conn-xp', name: 'XP Investimentos', accountInfo: 12345 }
    ]
    wrapper.vm.searchTerm = '123'

    expect(() => wrapper.vm.filteredConnectedBrokers).toThrow(TypeError)
  })

  it('accountInfo objeto também lança ao buscar por um termo que não está no nome', async () => {
    brokersStore.connectedBrokers = [
      { id: 'conn-btg', name: 'BTG', accountInfo: { number: '98765' } }
    ]
    wrapper.vm.searchTerm = '987'

    expect(() => wrapper.vm.filteredConnectedBrokers).toThrow(TypeError)
  })
})
