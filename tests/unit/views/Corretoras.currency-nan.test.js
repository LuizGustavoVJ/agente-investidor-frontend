import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

describe('Corretoras — formatCurrency com valor inválido', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } }
      ]
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

  it('nulo e undefined caem no fallback, mas NaN vaza no texto', () => {
    expect(wrapper.vm.formatCurrency(null)).toBe('R$ 0,00')
    expect(wrapper.vm.formatCurrency(undefined)).toBe('R$ 0,00')
    expect(wrapper.vm.formatCurrency(Number.NaN)).toMatch(/NaN/)
  })

  it('patrimônio NaN da corretora conectada aparece como NaN na UI', async () => {
    brokersStore.connectedBrokers = [
      {
        id: 'xp',
        name: 'XP',
        status: 'connected',
        totalValue: Number.NaN
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toMatch(/NaN/)
  })
})
