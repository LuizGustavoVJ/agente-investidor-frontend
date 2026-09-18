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

describe('Login — query.email duplicado vira array', () => {
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

    await router.push({
      name: 'Login',
      query: { email: ['vitima@email.com', 'phish@evil.test'] }
    })
    await router.isReady()

    wrapper = mount(Login, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('grava o array no formulário em vez de um único e-mail sanitizado', () => {
    expect(Array.isArray(wrapper.vm.form.email)).toBe(true)
    expect(wrapper.vm.form.email).toEqual(['vitima@email.com', 'phish@evil.test'])
  })

  it('isFormValid fica falso porque Array.includes procura o caractere @ entre os itens', async () => {
    await wrapper.get('#password').setValue('senha123')

    expect(wrapper.vm.form.email.includes('@')).toBe(false)
    expect(wrapper.vm.isFormValid).toBe(false)
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('validateForm recusa o array como e-mail inválido e não chama login', async () => {
    const loginSpy = vi.spyOn(authStore, 'login')
    await wrapper.get('#password').setValue('senha123')

    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.email).toBe('Email deve ser válido')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(loginSpy).not.toHaveBeenCalled()
  })
})
