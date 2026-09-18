import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Error404 from '@/components/Error404.vue'
import Error500 from '@/components/Error500.vue'
import { useAuthStore } from '@/stores/auth'

const RouterLinkStub = {
  props: ['to'],
  template: '<a class="btn-home" :href="typeof to === \'string\' ? to : to.path"><slot /></a>'
}

describe('Páginas de erro — destino fixo para Home', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('404 sempre aponta para / mesmo com usuário autenticado', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'u-1', name: 'Ana', email: 'ana@email.com' }

    const wrapper = mount(Error404, {
      global: {
        stubs: { 'router-link': RouterLinkStub }
      }
    })
    const homeLink = wrapper.find('a.btn-home')

    expect(homeLink.exists()).toBe(true)
    expect(homeLink.attributes('href')).toBe('/')
    expect(homeLink.text()).toContain('Voltar para Home')
    expect(wrapper.text()).not.toContain('Dashboard')
    expect(authStore.isAuthenticated).toBe(true)
    wrapper.unmount()
  })

  it('500 também volta só para / e ignora a sessão autenticada', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'u-1', name: 'Ana', email: 'ana@email.com' }

    const wrapper = mount(Error500, {
      global: {
        stubs: { 'router-link': RouterLinkStub }
      }
    })
    const homeLink = wrapper.find('a.btn-home')

    expect(homeLink.exists()).toBe(true)
    expect(homeLink.attributes('href')).toBe('/')
    expect(homeLink.text()).toContain('Voltar para Home')
    expect(wrapper.find('a[href="/dashboard"]').exists()).toBe(false)
    expect(authStore.isAuthenticated).toBe(true)
    wrapper.unmount()
  })
})
