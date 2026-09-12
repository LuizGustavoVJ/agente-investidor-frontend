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

describe('Login — validação de e-mail e payload', () => {
  let wrapper
  let pinia
  let authStore
  let router

  const mountLogin = async (query = {}) => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'Login', component: Login },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
      ]
    })

    await router.push({ name: 'Login', query })
    await router.isReady()

    wrapper = mount(Login, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    await wrapper.vm.$nextTick()
  }

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    vi.clearAllMocks()
    await mountLogin()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('habilita o envio com e-mail inválido que só contém @ (ex.: a@)', async () => {
    await wrapper.find('#email').setValue('a@')
    await wrapper.find('#password').setValue('senha12')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.vm.validateForm()).toBe(true)
  })

  it('habilita o envio com e-mail sem domínio (@x) e sem local-part', async () => {
    await wrapper.find('#email').setValue('@x')
    await wrapper.find('#password').setValue('senha12')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(true)
  })

  it('pré-preenche ?email= com espaços e envia sem trim (Cadastro faz trim; Login não)', async () => {
    wrapper.unmount()
    await mountLogin({ email: '  user@email.com  ' })
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue({ success: false })

    await wrapper.find('#password').setValue('senha12')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.vm.form.email).toBe('  user@email.com  ')
    expect(loginSpy).toHaveBeenCalledWith({
      email: '  user@email.com  ',
      password: 'senha12',
      rememberMe: false
    })
  })

  it('bloqueia o envio quando o e-mail não tem @', async () => {
    await wrapper.find('#email').setValue('usuario.email.com')
    await wrapper.find('#password').setValue('senha12')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isFormValid).toBe(false)
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
