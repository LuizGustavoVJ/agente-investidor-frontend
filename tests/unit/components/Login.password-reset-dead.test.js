import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import { authAPI } from '@/api/auth'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn(),
    requestPasswordReset: vi.fn()
  }
}))

const loginSource = readFileSync(
  resolve(__dirname, '../../../src/components/Login.vue'),
  'utf8'
)
const routerSource = readFileSync(
  resolve(__dirname, '../../../src/router/index.js'),
  'utf8'
)
const authApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/auth.js'),
  'utf8'
)

describe('Login — recuperação de senha aponta para rota inexistente e não chama a API', () => {
  let wrapper
  let router

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'Login', component: { template: '<div />' } },
        { path: '/cadastro', name: 'Cadastro', component: { template: '<div />' } },
        {
          path: '/:pathMatch(.*)*',
          name: 'Error404',
          component: { template: '<div class="not-found">404</div>' }
        }
      ]
    })
    await router.push('/login')
    await router.isReady()

    wrapper = mount(Login, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('router e Login não declaram /recuperar-senha; a API de reset existe e não é usada', () => {
    expect(loginSource).toMatch(/to=["']\/recuperar-senha["']/)
    expect(loginSource).not.toMatch(/requestPasswordReset/)
    expect(routerSource).not.toMatch(/recuperar-senha/)
    expect(authApiSource).toMatch(/requestPasswordReset/)
    expect(typeof authAPI.requestPasswordReset).toBe('function')
  })

  it('clique em Esqueceu a senha? navega para /recuperar-senha e cai no catch-all 404', async () => {
    const forgot = wrapper.find('.forgot-password')
    expect(forgot.exists()).toBe(true)
    expect(forgot.text()).toMatch(/esqueceu a senha/i)
    expect(forgot.attributes('href') || forgot.attributes('to')).toBeDefined()

    await forgot.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/recuperar-senha')
    expect(router.currentRoute.value.name).toBe('Error404')
    expect(authAPI.requestPasswordReset).not.toHaveBeenCalled()
    expect(authAPI.login).not.toHaveBeenCalled()
  })
})
