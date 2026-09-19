import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

import Configuracoes from '@/views/Configuracoes.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }]
})

describe('Configuracoes — ícone de dispositivo', () => {
  let wrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.loadUserSettings = vi.fn().mockResolvedValue({ success: true })

    wrapper = mount(Configuracoes, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })

    await router.isReady()
    await flushPromises()
  })

  it('sessão sem device lança TypeError em toLowerCase', () => {
    expect(() => wrapper.vm.getDeviceIcon(undefined)).toThrow(TypeError)
    expect(() => wrapper.vm.getDeviceIcon(null)).toThrow(TypeError)
  })

  it('device mobile/tablet/desktop devolve o ícone esperado', () => {
    expect(wrapper.vm.getDeviceIcon('iPhone mobile')).toBe('📱')
    expect(wrapper.vm.getDeviceIcon('iPad tablet')).toBe('📱')
    expect(wrapper.vm.getDeviceIcon('Windows PC')).toBe('💻')
  })
})
