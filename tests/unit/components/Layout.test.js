import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Layout from '@/components/Layout.vue'

describe('Layout', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(Layout, {
      global: {
        stubs: {
          'router-view': { template: '<div class="outlet">conteúdo</div>' }
        }
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('mostra o nome do usuário e a inicial no avatar', () => {
    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.find('.profile-avatar').text()).toBe('J')
    expect(wrapper.text()).toContain('Painel do Investidor')
  })

  it('abre e fecha o menu de perfil no clique', async () => {
    expect(wrapper.find('.profile-menu').exists()).toBe(false)

    await wrapper.find('.profile').trigger('click')
    expect(wrapper.find('.profile-menu').exists()).toBe(true)
    expect(wrapper.find('.profile-menu button').text()).toContain('Logout')

    await wrapper.find('.profile').trigger('click')
    expect(wrapper.find('.profile-menu').exists()).toBe(false)
  })

  it('redireciona para /login no logout', async () => {
    await wrapper.find('.profile').trigger('click')
    await wrapper.find('.profile-menu button').trigger('click')

    expect(window.location.href).toBe('/login')
  })
})
