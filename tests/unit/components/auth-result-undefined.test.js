import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import Cadastro from '@/components/Cadastro.vue'
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

const routes = [
  { path: '/', name: 'Home', component: { template: '<div />' } },
  { path: '/login', name: 'Login', component: Login },
  { path: '/cadastro', name: 'Cadastro', component: Cadastro },
  { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
]

describe('Login/Cadastro — store devolve undefined', () => {
  let wrapper
  let pinia
  let authStore
  let router

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    await router.push('/login')
    await router.isReady()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('Login trata result undefined como erro inesperado e não navega', async () => {
    wrapper = mount(Login, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'login').mockResolvedValue(undefined)

    await wrapper.find('#email').setValue('user@email.com')
    await wrapper.find('#password').setValue('senha123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Erro inesperado no login')
    expect(pushSpy).not.toHaveBeenCalled()
  })

  it('Cadastro trata result undefined como erro inesperado e não navega', async () => {
    await router.push('/cadastro')
    wrapper = mount(Cadastro, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'register').mockResolvedValue(undefined)

    await wrapper.find('#name').setValue('Maria Silva')
    await wrapper.find('#email').setValue('maria@email.com')
    await wrapper.find('#password').setValue('SenhaForte1')
    await wrapper.find('#confirmPassword').setValue('SenhaForte1')
    const terms = wrapper.find('#acceptTerms')
    if (terms.exists()) {
      await terms.setValue(true)
    } else {
      wrapper.vm.form.acceptTerms = true
    }
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Erro inesperado ao criar conta')
    expect(pushSpy).not.toHaveBeenCalled()
  })
})
