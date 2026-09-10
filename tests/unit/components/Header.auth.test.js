import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Header from '@/components/Header.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', name: 'Home', component: { template: '<div />' } },
  { path: '/login', name: 'Login', component: { template: '<div />' } },
  { path: '/cadastro', name: 'Cadastro', component: { template: '<div />' } },
  { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
]

describe('Header — CTAs de autenticação', () => {
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHistory(),
      routes
    })
    await router.push('/')
    await router.isReady()
  })

  const mountHeader = () =>
    mount(Header, {
      global: {
        plugins: [router]
      }
    })

  it('mostra Entrar e Criar conta mesmo com usuário autenticado', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'u-1', name: 'Maria Silva', email: 'maria@email.com' }

    const wrapper = mountHeader()

    expect(authStore.isAuthenticated).toBe(true)
    expect(wrapper.text()).toContain('Entrar')
    expect(wrapper.text()).toContain('Criar conta')
    expect(wrapper.text()).not.toMatch(/sair|logout|minha conta/i)

    const loginLink = wrapper.find('a[href="/login"]')
    const signupLink = wrapper.find('a[href="/cadastro"]')
    expect(loginLink.exists()).toBe(true)
    expect(signupLink.exists()).toBe(true)
  })

  it('expõe Dashboard a visitante não autenticado', () => {
    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(false)

    const wrapper = mountHeader()
    const dashboardLink = wrapper.find('a[href="/dashboard"]')

    expect(dashboardLink.exists()).toBe(true)
    expect(dashboardLink.text()).toContain('Dashboard')
  })
})
