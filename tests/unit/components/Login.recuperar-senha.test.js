import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Login from '@/components/Login.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', name: 'Login', component: Login },
    { path: '/recuperar-senha', name: 'RecuperarSenha', component: { template: '<div>reset</div>' } },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
  ]
})

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

describe('Login — recuperação de senha e rotas públicas do client', () => {
  let wrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    await router.push('/login')
    wrapper = mount(Login, {
      global: {
        plugins: [router]
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('oferece o atalho Esqueceu a senha? para /recuperar-senha', () => {
    const link = wrapper.find('.forgot-password')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Esqueceu a senha?')
    expect(link.attributes('href') || link.attributes('to')).toBe('/recuperar-senha')
  })

  it('mantém /recuperar-senha como rota pública no interceptor 401', () => {
    const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
    expect(clientSource).toContain("const publicRoutes = ['/', '/login', '/cadastro', '/recuperar-senha']")
  })
})
