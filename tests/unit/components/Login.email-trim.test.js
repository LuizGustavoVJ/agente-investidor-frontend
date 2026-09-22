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

describe('Login — e-mail com espaços vai cru para a API', () => {
  let wrapper
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'Login', component: { template: '<div />' } },
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
    await flushPromises()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('validateForm aceita e-mail com espaços e handleLogin envia o valor sem trim', async () => {
    const store = useAuthStore()
    store.login = vi.fn().mockResolvedValue({ success: true })

    wrapper.vm.form.email = '  ana@email.com  '
    wrapper.vm.form.password = 'senha123'

    expect(wrapper.vm.validateForm()).toBe(true)

    await wrapper.vm.handleLogin()
    await flushPromises()

    expect(store.login).toHaveBeenCalledWith({
      email: '  ana@email.com  ',
      password: 'senha123',
      rememberMe: false
    })
  })
})
