import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div />' } },
    { path: '/configuracoes', name: 'Configuracoes', component: Configuracoes }
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

describe('Configuracoes — merge raso de notificationSettings', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.user = {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@email.com',
      notificationSettings: {
        email: { weeklyReports: false }
      }
    }
    authStore.loadUserSettings = vi.fn().mockResolvedValue({ success: true })

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('payload parcial apaga o ramo push e deixa criticalAlerts indefinido', () => {
    expect(wrapper.vm.notificationsForm.email.weeklyReports).toBe(false)
    expect(wrapper.vm.notificationsForm.push).toBeUndefined()
    expect(() => wrapper.vm.notificationsForm.push.criticalAlerts).toThrow(TypeError)
  })
})
