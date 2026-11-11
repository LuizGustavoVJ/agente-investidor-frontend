import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Login — fluxo de autenticação', () => {
  let wrapper
  let authStore
  let router

  const mountLogin = async (query = {}) => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div />' } },
        { path: '/login', name: 'Login', component: { template: '<div />' } },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } }
      ]
    })
    await router.push({ path: '/login', query })
    await router.isReady()

    const pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()

    wrapper = mount(Login, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('não chama a store quando o email é inválido', async () => {
    await mountLogin()
    const loginSpy = vi.spyOn(authStore, 'login')
    wrapper.vm.form.email = 'sem-arroba'
    wrapper.vm.form.password = 'senha123'

    await wrapper.vm.handleLogin()

    expect(wrapper.vm.errors.email).toBe('Email deve ser válido')
    expect(loginSpy).not.toHaveBeenCalled()
  })

  it('aceita senha de 6 caracteres e envia rememberMe para a store', async () => {
    await mountLogin()
    vi.spyOn(authStore, 'login').mockResolvedValue({ success: true })
    wrapper.vm.form.email = 'user@test.com'
    wrapper.vm.form.password = '123456'
    wrapper.vm.form.rememberMe = true

    await wrapper.vm.handleLogin()

    expect(authStore.login).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: '123456',
      rememberMe: true
    })
  })

  it('respeita query.redirect após login bem-sucedido', async () => {
    await mountLogin({ redirect: '/corretoras' })
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'login').mockResolvedValue({ success: true })
    wrapper.vm.form.email = 'user@test.com'
    wrapper.vm.form.password = 'senha123'

    await wrapper.vm.handleLogin()

    expect(pushSpy).toHaveBeenCalledWith('/corretoras')
  })

  it('não navega quando o login falha', async () => {
    await mountLogin()
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'login').mockResolvedValue({ success: false, error: 'Credenciais inválidas' })
    wrapper.vm.form.email = 'user@test.com'
    wrapper.vm.form.password = 'errada1'

    await wrapper.vm.handleLogin()

    expect(mockToast.error).toHaveBeenCalledWith('Credenciais inválidas')
    expect(pushSpy).not.toHaveBeenCalled()
  })

  it('pré-preenche email vindo da query string', async () => {
    await mountLogin({ email: 'ana@test.com' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.email).toBe('ana@test.com')
  })
})
