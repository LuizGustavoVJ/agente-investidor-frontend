import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div />' } },
    { path: '/login', name: 'Login', component: Login },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
    { path: '/cadastro', name: 'Cadastro', component: { template: '<div />' } }
  ]
})

describe('Login — OAuth não autentica', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()

    wrapper = mount(Login, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })

    await router.isReady()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('botão Google informa que está em desenvolvimento e não chama login', async () => {
    const loginSpy = vi.spyOn(authStore, 'login')

    await wrapper.find('.oauth-button.google').trigger('click')

    expect(mockToast.info).toHaveBeenCalledWith('Login com Google em desenvolvimento')
    expect(loginSpy).not.toHaveBeenCalled()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()
  })

  it('botão GitHub informa que está em desenvolvimento e não chama login', async () => {
    const loginSpy = vi.spyOn(authStore, 'login')

    await wrapper.find('.oauth-button.github').trigger('click')

    expect(mockToast.info).toHaveBeenCalledWith('Login com GitHub em desenvolvimento')
    expect(loginSpy).not.toHaveBeenCalled()
    expect(authStore.isAuthenticated).toBe(false)
  })
})
