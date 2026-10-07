import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
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

describe('Login — senha só com espaços passa na validação', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.spyOn(authStore, 'login').mockResolvedValue({ success: false, error: 'credenciais' })

    const router = createRouter({
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
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('isFormValid aceita senha de 6 espaços e e-mail mínimo com @', () => {
    wrapper.vm.form.email = 'a@b'
    wrapper.vm.form.password = '      '

    expect(wrapper.vm.isFormValid).toBe(true)
  })

  it('validateForm não rejeita senha em branco com 6+ espaços', () => {
    wrapper.vm.form.email = 'a@b'
    wrapper.vm.form.password = '      '

    expect(wrapper.vm.validateForm()).toBe(true)
    expect(wrapper.vm.errors.password).toBe('')
  })

  it('handleLogin envia a senha de espaços para a store', async () => {
    wrapper.vm.form.email = 'a@b'
    wrapper.vm.form.password = '      '

    await wrapper.vm.handleLogin()

    expect(authStore.login).toHaveBeenCalledWith({
      email: 'a@b',
      password: '      ',
      rememberMe: false
    })
  })
})
