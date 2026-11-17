import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}
const mockPush = vi.fn()
const routeQuery = { redirect: undefined, email: undefined }

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: routeQuery })
}))

const { authAPI } = vi.hoisted(() => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

vi.mock('@/api/auth', () => ({ authAPI }))

import Login from '@/components/Login.vue'

describe('Login — redirect, rememberMe e validação', () => {
  let wrapper
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    routeQuery.redirect = undefined
    routeQuery.email = undefined
    authAPI.login.mockResolvedValue({
      data: { success: true, user: { id: 1, email: 'ana@ex.com' } }
    })

    wrapper = mount(Login, {
      global: {
        stubs: { 'router-link': true }
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('pré-preenche e-mail vindo da query string', async () => {
    routeQuery.email = 'ana@ex.com'
    wrapper.unmount()
    wrapper = mount(Login, {
      global: { stubs: { 'router-link': true } }
    })

    expect(wrapper.vm.form.email).toBe('ana@ex.com')
  })

  it('envia rememberMe para a store mesmo a API descartando o campo', async () => {
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.password = '123456'
    wrapper.vm.form.rememberMe = true

    await wrapper.vm.handleLogin()

    expect(authAPI.login).toHaveBeenCalledWith({
      email: 'ana@ex.com',
      password: '123456',
      rememberMe: true
    })
  })

  it('aceita senha de 6 caracteres, mais fraca que o cadastro', () => {
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.password = '123456'

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(true)
  })

  it('recusa senha de 5 caracteres', () => {
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.password = '12345'

    expect(wrapper.vm.isFormValid).toBe(false)
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.password).toBe('Senha deve ter pelo menos 6 caracteres')
  })

  it('usa /dashboard quando não há redirect', async () => {
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.password = '123456'

    await wrapper.vm.handleLogin()

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('repassa redirect absoluto e protocol-relative sem allowlist', async () => {
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.password = '123456'

    routeQuery.redirect = 'https://evil.test/phish'
    await wrapper.vm.handleLogin()
    expect(mockPush).toHaveBeenCalledWith('https://evil.test/phish')

    mockPush.mockClear()
    authAPI.login.mockResolvedValue({
      data: { success: true, user: { id: 1, email: 'ana@ex.com' } }
    })
    routeQuery.redirect = '//evil.test/cookie'
    await wrapper.vm.handleLogin()
    expect(mockPush).toHaveBeenCalledWith('//evil.test/cookie')
  })

  it('não navega quando o login falha', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: false, message: 'Credenciais inválidas' }
    })
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.password = '123456'
    routeQuery.redirect = '/portfolio'

    await wrapper.vm.handleLogin()

    expect(mockPush).not.toHaveBeenCalled()
    expect(store.isAuthenticated).toBe(false)
  })
})
