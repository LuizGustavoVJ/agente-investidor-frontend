import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

describe('Configurações — getDeviceIcon sem device', () => {
  let wrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div />' } },
        { path: '/configuracoes', name: 'Configuracoes', component: Configuracoes }
      ]
    })
    await router.push('/configuracoes')
    await router.isReady()

    const store = useAuthStore()
    store.user = { id: 'u-1', email: 'user@email.com', firstName: 'Ana' }

    wrapper = mount(Configuracoes, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })
    await flushPromises()
  })

  it('lança TypeError quando session.device é undefined', () => {
    expect(() => wrapper.vm.getDeviceIcon(undefined)).toThrow(TypeError)
    expect(() => wrapper.vm.getDeviceIcon(null)).toThrow(TypeError)
  })

  it('reconhece mobile e tablet; qualquer outro valor vira desktop', () => {
    expect(wrapper.vm.getDeviceIcon('iPhone mobile')).toBe('📱')
    expect(wrapper.vm.getDeviceIcon('iPad Tablet')).toBe('📱')
    expect(wrapper.vm.getDeviceIcon('Windows PC')).toBe('💻')
  })
})
