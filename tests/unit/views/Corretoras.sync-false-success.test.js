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

describe('Corretoras — sync ignora { success: false } da store', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.info.mockReset()

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

  it('syncAllBrokers com { success: false } tosta sucesso e não mostra erro', async () => {
    vi.spyOn(brokersStore, 'syncAllBrokers').mockResolvedValue({
      success: false,
      error: 'timeout na XP'
    })

    await wrapper.vm.syncAllBrokers()
    await flushPromises()

    expect(brokersStore.syncAllBrokers).toHaveBeenCalledTimes(1)
    expect(mockToast.success).toHaveBeenCalledWith('Sincronização concluída!')
    expect(mockToast.error).not.toHaveBeenCalled()
    expect(wrapper.vm.isSyncing).toBe(false)
  })

  it('syncBroker com { success: false } tosta sucesso da corretora', async () => {
    vi.spyOn(brokersStore, 'syncBroker').mockResolvedValue({
      success: false,
      error: 'credencial expirada'
    })

    await wrapper.vm.syncBroker({ id: 'conn-xp', name: 'XP' })
    await flushPromises()

    expect(brokersStore.syncBroker).toHaveBeenCalledWith('conn-xp')
    expect(mockToast.success).toHaveBeenCalledWith('XP sincronizada com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalled()
  })
})
