import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Layout from '@/components/Layout.vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

describe('Layout, Header e Footer — sessão e links', () => {
  beforeEach(() => {
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
    sessionStorage.removeItem.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Layout faz logout só com window.location, sem limpar sessionStorage', async () => {
    const wrapper = mount(Layout, {
      global: { stubs: { 'router-view': true, RouterView: true } }
    })

    await wrapper.find('.profile').trigger('click')
    expect(wrapper.find('.profile-menu').exists()).toBe(true)

    await wrapper.find('.profile-menu button').trigger('click')

    expect(window.location.href).toBe('/login')
    expect(sessionStorage.removeItem).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('avatar usa usuario.nome.charAt(0) — nome undefined lança no template', async () => {
    const wrapper = mount(Layout, {
      global: { stubs: { 'router-view': true } }
    })
    expect(wrapper.find('.profile-avatar').text()).toBe('J')

    wrapper.vm.usuario.nome = undefined
    await expect(wrapper.vm.$nextTick()).rejects.toThrow()
    wrapper.unmount()
  })

  it('Header sempre mostra Entrar/Criar conta — não há estado autenticado', () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
          }
        }
      }
    })

    const hrefs = wrapper.findAll('a').map(a => a.attributes('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/dashboard', '/login', '/cadastro']))
    expect(wrapper.text()).toContain('Entrar')
    expect(wrapper.text()).toContain('Criar conta')
    expect(wrapper.text()).not.toContain('Sair')
    wrapper.unmount()
  })

  it('Footer aponta Termos e Privacidade para href="#", não para as rotas /termos e /privacidade', () => {
    const wrapper = mount(Footer)
    const hrefs = wrapper.findAll('a').map(a => a.attributes('href'))
    expect(hrefs).toEqual(['#', '#'])
    expect(wrapper.text()).toContain('© 2025')
    wrapper.unmount()
  })
})
