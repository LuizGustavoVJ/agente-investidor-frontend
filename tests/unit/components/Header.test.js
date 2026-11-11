import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import Header from '@/components/Header.vue'
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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/dashboard', component: { template: '<div />' } },
    { path: '/login', component: { template: '<div />' } },
    { path: '/cadastro', component: { template: '<div />' } }
  ]
})

describe('Header', () => {
  const mountHeader = () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    return {
      pinia,
      wrapper: mount(Header, {
        global: {
          plugins: [pinia, router],
          stubs: { 'router-link': { template: '<a :href="to"><slot /></a>', props: ['to'] } }
        }
      })
    }
  }

  it('sempre oferece Dashboard, Entrar e Criar conta', () => {
    const { wrapper } = mountHeader()
    const hrefs = wrapper.findAll('a').map(a => a.attributes('href'))

    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/login')
    expect(hrefs).toContain('/cadastro')
    expect(wrapper.text()).toContain('Entrar')
    expect(wrapper.text()).toContain('Criar conta')
  })

  it('continua mostrando Entrar/Criar conta mesmo com usuário autenticado e não tem Sair', () => {
    const { wrapper, pinia } = mountHeader()
    const authStore = useAuthStore(pinia)
    authStore.user = { id: 1, name: 'Ana' }

    expect(wrapper.text()).toContain('Entrar')
    expect(wrapper.text()).toContain('Criar conta')
    expect(wrapper.text()).not.toContain('Sair')
    expect(wrapper.text()).not.toContain('Logout')
  })
})
