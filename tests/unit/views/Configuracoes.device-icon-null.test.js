import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
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

describe('Configuracoes — getDeviceIcon sem guard derruba sessões', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useAuthStore()
    store.user = {
      id: 3,
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@exemplo.com',
      twoFactorEnabled: true
    }
    store.loadUserSettings = vi.fn().mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } }
      ]
    })
    await router.push('/configuracoes')
    await router.isReady()

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('device null ou undefined lança TypeError em toLowerCase', () => {
    expect(() => wrapper.vm.getDeviceIcon(null)).toThrow(TypeError)
    expect(() => wrapper.vm.getDeviceIcon(undefined)).toThrow(TypeError)
  })

  it('device numérico também lança — sessão sem string quebra o v-for', () => {
    expect(() => wrapper.vm.getDeviceIcon(0)).toThrow(TypeError)
    expect(() => wrapper.vm.getDeviceIcon(42)).toThrow(TypeError)
  })

  it('render da seção segurança com device null propaga o throw do ícone', async () => {
    store.activeSessions = [
      {
        id: 'sess-mobile',
        device: null,
        location: 'São Paulo',
        lastActivity: '2026-10-01T10:00:00Z',
        isCurrent: false
      }
    ]
    wrapper.vm.activeSection = 'security'

    await expect(wrapper.vm.$nextTick()).rejects.toThrow()
  })
})
