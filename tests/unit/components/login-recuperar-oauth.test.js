import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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

const routes = [
  { path: '/', component: { template: '<div />' } },
  { path: '/login', component: { template: '<div />' } },
  { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
  { path: '/cadastro', component: { template: '<div />' } }
]

describe('Login — recuperar senha, OAuth e redirect', () => {
  let router
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({ history: createWebHistory(), routes })
    await router.push('/login')
    await router.isReady()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    mockToast.info.mockClear()
  })

  const mountLogin = () => mount(Login, {
    global: {
      plugins: [pinia, router],
      stubs: {
        'router-link': {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>'
        }
      }
    }
  })

  it('link "Esqueceu a senha?" aponta para /recuperar-senha, rota inexistente no router', () => {
    const wrapper = mountLogin()
    const hrefs = wrapper.findAll('a').map(a => a.attributes('href'))
    expect(hrefs).toContain('/recuperar-senha')
    expect(router.getRoutes().some(r => r.path === '/recuperar-senha')).toBe(false)
    wrapper.unmount()
  })

  it('OAuth Google/GitHub só disparam toast de "em desenvolvimento" — não navegam', async () => {
    const wrapper = mountLogin()
    const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {})

    await wrapper.find('.oauth-button.google').trigger('click')
    await wrapper.find('.oauth-button.github').trigger('click')

    expect(mockToast.info).toHaveBeenCalledWith('Login com Google em desenvolvimento')
    expect(mockToast.info).toHaveBeenCalledWith('Login com GitHub em desenvolvimento')
    expect(window.location.href).not.toMatch(/\/api\/auth\/google/)
    expect(assignSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('pré-preenche email a partir de query.email', async () => {
    await router.push('/login?email=ana%40ex.com')
    await router.isReady()
    const wrapper = mountLogin()
    await flushPromises()
    expect(wrapper.find('input#email').element.value).toBe('ana@ex.com')
    wrapper.unmount()
  })

  it('sucesso de login navega para query.redirect cru — open redirect interno', async () => {
    await router.push('/login?redirect=/dashboard?next=https://evil.example')
    const wrapper = mountLogin()
    const store = useAuthStore()
    vi.spyOn(store, 'login').mockResolvedValue({ success: true })
    vi.spyOn(store, 'clearError').mockImplementation(() => {})
    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.find('input#email').setValue('ana@ex.com')
    await wrapper.find('input#password').setValue('senha12')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(store.login).toHaveBeenCalledWith({
      email: 'ana@ex.com',
      password: 'senha12',
      rememberMe: false
    })
    expect(pushSpy).toHaveBeenCalledWith('/dashboard?next=https://evil.example')
    wrapper.unmount()
  })

  it('rememberMe true é enviado à store mesmo a API descartando o campo', async () => {
    const wrapper = mountLogin()
    const store = useAuthStore()
    vi.spyOn(store, 'login').mockResolvedValue({ success: false, error: 'x' })
    vi.spyOn(store, 'clearError').mockImplementation(() => {})

    await wrapper.find('input#email').setValue('ana@ex.com')
    await wrapper.find('input#password').setValue('senha12')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(store.login).toHaveBeenCalledWith({
      email: 'ana@ex.com',
      password: 'senha12',
      rememberMe: true
    })
    wrapper.unmount()
  })
})
