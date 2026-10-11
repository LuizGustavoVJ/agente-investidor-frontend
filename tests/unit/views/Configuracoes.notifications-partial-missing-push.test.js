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

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

function partialNotificationSettings() {
  return {
    email: {
      weeklyReports: false,
      marketAlerts: true,
      aiRecommendations: false
    }
  }
}

describe('Configuracoes — notificationSettings parcial sem push', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()

    const settings = partialNotificationSettings()
    store.user = {
      id: 4,
      firstName: 'Ana',
      lastName: 'Lima',
      email: 'ana@exemplo.com',
      notificationSettings: settings
    }
    store.error = null
    store.loadUserSettings = vi.fn().mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } }
      ]
    })

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('cópia rasa de payload sem push deixa notificationsForm.push indefinido', () => {
    expect(store.loadUserSettings).toHaveBeenCalled()
    expect(wrapper.vm.notificationsForm.email.weeklyReports).toBe(false)
    expect(wrapper.vm.notificationsForm.push).toBeUndefined()
    expect(() => wrapper.vm.notificationsForm.push.criticalAlerts).toThrow()
  })

  it('toggle de email muta o objeto aninhado do user antes de salvar', async () => {
    expect(wrapper.vm.notificationsForm.email).toBe(store.user.notificationSettings.email)

    wrapper.vm.notificationsForm.email.weeklyReports = true
    await wrapper.vm.$nextTick()

    expect(store.user.notificationSettings.email.weeklyReports).toBe(true)
    expect(store.user.notificationSettings.push).toBeUndefined()
  })

  it('abrir a seção Notificações quebra o render ao ler push.criticalAlerts', async () => {
    wrapper.vm.activeSection = 'notifications'

    await expect(wrapper.vm.$nextTick()).rejects.toThrow()
    expect(wrapper.vm.notificationsForm.push).toBeUndefined()
  })
})
