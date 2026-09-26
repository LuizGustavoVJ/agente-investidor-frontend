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

describe('Corretoras — syncBroker com success: false ainda celebra', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'syncBroker').mockResolvedValue({
      success: false,
      error: 'Auth expired'
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/corretoras', component: { template: '<div />' } }]
    })

    wrapper = mount(Corretoras, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    mockToast.info.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('toast de sucesso aparece mesmo quando a store devolve falha', async () => {
    await wrapper.vm.syncBroker({ id: 3, name: 'XP Investimentos' })
    await flushPromises()

    expect(brokersStore.syncBroker).toHaveBeenCalledWith(3)
    expect(mockToast.success).toHaveBeenCalledWith('XP Investimentos sincronizada com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalled()
  })
})
