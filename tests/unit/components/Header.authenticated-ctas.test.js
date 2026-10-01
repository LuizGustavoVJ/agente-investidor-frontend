import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Header from '@/components/Header.vue'
import { useAuthStore } from '@/stores/auth'

describe('Header — CTAs de convidado permanecem com sessão autenticada', () => {
  let wrapper
  let store
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useAuthStore()
    store.user = {
      id: 42,
      name: 'Maria Investidora',
      email: 'maria@exemplo.com'
    }

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div />' } },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/login', name: 'Login', component: { template: '<div />' } },
        { path: '/cadastro', name: 'Cadastro', component: { template: '<div />' } }
      ]
    })
    await router.push('/')
    await router.isReady()

    wrapper = mount(Header, {
      global: { plugins: [router] }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('mostra Entrar e Criar conta mesmo com isAuthenticated true', () => {
    expect(store.isAuthenticated).toBe(true)
    expect(wrapper.text()).toContain('Entrar')
    expect(wrapper.text()).toContain('Criar conta')
    expect(wrapper.find('a.btn-login').attributes('href')).toBe('/login')
    expect(wrapper.find('a.btn-create').attributes('href')).toBe('/cadastro')
    expect(wrapper.text()).not.toContain('Sair')
    expect(wrapper.text()).not.toContain('Maria Investidora')
  })

  it('não consulta a store de auth para decidir os CTAs', () => {
    expect(wrapper.vm.authStore).toBeUndefined()
    store.user = null
    expect(store.isAuthenticated).toBe(false)
    expect(wrapper.text()).toContain('Entrar')
    expect(wrapper.text()).toContain('Criar conta')
  })
})
