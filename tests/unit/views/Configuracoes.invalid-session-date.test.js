import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }]
})

describe('Configuracoes: data de sessão inválida derruba a aba de segurança', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    toast.success.mockClear()
    toast.error.mockClear()

    const pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    authStore.user = {
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@invest.com'
    }

    wrapper = mount(Configuracoes, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    await router.isReady()
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('formatDate(null) cai no fallback e data inválida lança', () => {
    expect(wrapper.vm.formatDate(null)).toBe('Nunca')
    expect(wrapper.vm.formatDate(undefined)).toBe('Nunca')
    expect(() => wrapper.vm.formatDate('ontem')).toThrow()
  })

  it('getDeviceIcon com string vazia não lança e devolve o ícone desktop', () => {
    expect(wrapper.vm.getDeviceIcon('')).toBe('💻')
  })
})
