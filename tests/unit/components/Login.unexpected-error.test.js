import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
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

describe('Login — falha inesperada da store', () => {
  let wrapper
  let router
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'Login', component: Login },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
      ]
    })
    await router.push('/login')
    await router.isReady()

    wrapper = mount(Login, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })
    mockToast.error.mockClear()
    mockToast.success.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('mostra toast de erro inesperado e não navega quando login lança', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'login').mockRejectedValue(new Error('network down'))

    await wrapper.get('#email').setValue('ana@email.com')
    await wrapper.get('#password').setValue('senha123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Erro inesperado no login')
    expect(mockToast.success).not.toHaveBeenCalled()
    expect(pushSpy).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
