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

describe('Login — redirect após autenticação', () => {
  let wrapper
  let pinia
  let authStore
  let router

  const mountLogin = async (query = {}) => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div />' } },
        { path: '/login', name: 'Login', component: Login },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
      ]
    })

    await router.push({ name: 'Login', query })
    await router.isReady()

    wrapper = mount(Login, {
      global: {
        plugins: [pinia, router],
        stubs: {
          'router-link': true
        }
      }
    })
    await wrapper.vm.$nextTick()
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  const submitValidLogin = async () => {
    await wrapper.find('#email').setValue('user@email.com')
    await wrapper.find('#password').setValue('senha123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  it('encaminha URL absoluta do query redirect sem sanitizar (open redirect)', async () => {
    await mountLogin({ redirect: 'https://evil.example/phish' })
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'login').mockResolvedValue({ success: true })

    await submitValidLogin()

    expect(pushSpy).toHaveBeenCalledWith('https://evil.example/phish')
  })

  it('encaminha redirect protocol-relative sem validar origem', async () => {
    await mountLogin({ redirect: '//phish.example/login' })
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'login').mockResolvedValue({ success: true })

    await submitValidLogin()

    expect(pushSpy).toHaveBeenCalledWith('//phish.example/login')
  })

  it('não navega quando o login falha, mesmo com redirect malicioso', async () => {
    await mountLogin({ redirect: 'https://evil.example' })
    const pushSpy = vi.spyOn(router, 'push')
    vi.spyOn(authStore, 'login').mockResolvedValue({
      success: false,
      error: 'Credenciais inválidas'
    })

    await submitValidLogin()

    expect(pushSpy).not.toHaveBeenCalled()
  })
})
