import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Layout from '@/components/Layout.vue'

describe('Layout — logout sem limpar sessão', () => {
  let wrapper
  let storage

  beforeEach(() => {
    storage = { user: JSON.stringify({ id: 1, name: 'Ana' }) }
    sessionStorage.getItem.mockImplementation((key) => (key in storage ? storage[key] : null))
    sessionStorage.setItem.mockImplementation((key, value) => {
      storage[key] = String(value)
    })
    sessionStorage.removeItem.mockImplementation((key) => {
      delete storage[key]
    })
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'

    wrapper = mount(Layout, {
      global: {
        stubs: { 'router-view': true, 'router-link': true }
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('redireciona para /login sem apagar sessionStorage nem chamar a API', () => {
    wrapper.vm.logout()

    expect(window.location.href).toBe('/login')
    expect(storage.user).toBe(JSON.stringify({ id: 1, name: 'Ana' }))
    expect(sessionStorage.removeItem).not.toHaveBeenCalled()
  })

  it('usa o primeiro caractere do nome hardcoded Jane no avatar', () => {
    expect(wrapper.vm.usuario.nome).toBe('Jane')
    expect(wrapper.find('.profile-avatar').text()).toBe('J')
  })
})
