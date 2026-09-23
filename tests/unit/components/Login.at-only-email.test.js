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

describe('Login — e-mail só com @ passa na validação fraca', () => {
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

  it('isFormValid e validateForm aceitam "@" como e-mail', () => {
    wrapper.vm.form.email = '@'
    wrapper.vm.form.password = '123456'

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(true)
  })

  it('handleLogin envia "@" cru para a store', async () => {
    const store = useAuthStore()
    store.login = vi.fn().mockResolvedValue({ success: false, error: 'inválido' })

    wrapper.vm.form.email = '@'
    wrapper.vm.form.password = '123456'

    await wrapper.vm.handleLogin()
    await flushPromises()

    expect(store.login).toHaveBeenCalledWith({
      email: '@',
      password: '123456',
      rememberMe: false
    })
  })

  it('e-mail "a@" também passa — includes("@") não exige domínio', () => {
    wrapper.vm.form.email = 'a@'
    wrapper.vm.form.password = '123456'

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(true)
  })
})
