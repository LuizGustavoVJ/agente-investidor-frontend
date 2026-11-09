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
    { path: '/', component: { template: '<div />' } },
    { path: '/login', component: { template: '<div />' } },
    { path: '/dashboard', name: 'dashboard', component: { template: '<div />' } }
  ]
})

describe('Login — validação e redirecionamento', () => {
  let wrapper
  let authStore
  let pinia

  const mountLogin = async (query = {}) => {
    await router.push({ path: '/login', query })
    await router.isReady()
    wrapper = mount(Login, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
  }

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    vi.clearAllMocks()
    await mountLogin()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('validateForm exige email com @ e senha com pelo menos 6 caracteres', () => {
    wrapper.vm.form.email = 'invalido'
    wrapper.vm.form.password = '123'

    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.email).toBe('Email deve ser válido')
    expect(wrapper.vm.errors.password).toBe('Senha deve ter pelo menos 6 caracteres')
  })

  it('isFormValid trava o submit com senha curta mesmo com email ok', async () => {
    wrapper.vm.form.email = 'ana@email.com'
    wrapper.vm.form.password = '12345'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isFormValid).toBeFalsy()
    expect(wrapper.find('button[type="submit"]').element.disabled).toBe(true)
  })

  it('não chama a store quando a validação falha', async () => {
    const loginSpy = vi.spyOn(authStore, 'login')

    await wrapper.vm.handleLogin()

    expect(loginSpy).not.toHaveBeenCalled()
  })

  it('envia rememberMe junto das credenciais', async () => {
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue({ success: true })
    wrapper.vm.form.email = 'ana@email.com'
    wrapper.vm.form.password = 'senha123'
    wrapper.vm.form.rememberMe = true

    await wrapper.vm.handleLogin()

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'ana@email.com',
      password: 'senha123',
      rememberMe: true
    })
  })

  it('respeita query.redirect após login bem-sucedido', async () => {
    wrapper.unmount()
    await mountLogin({ redirect: '/corretoras' })
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'login').mockResolvedValue({ success: true })

    wrapper.vm.form.email = 'ana@email.com'
    wrapper.vm.form.password = 'senha123'
    await wrapper.vm.handleLogin()

    expect(pushSpy).toHaveBeenCalledWith('/corretoras')
  })

  it('exibe erro da store sem navegar quando o login falha', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'login').mockResolvedValue({
      success: false,
      error: 'Credenciais inválidas'
    })

    wrapper.vm.form.email = 'ana@email.com'
    wrapper.vm.form.password = 'senha123'
    await wrapper.vm.handleLogin()

    expect(mockToast.error).toHaveBeenCalledWith('Credenciais inválidas')
    expect(pushSpy).not.toHaveBeenCalled()
  })
})
