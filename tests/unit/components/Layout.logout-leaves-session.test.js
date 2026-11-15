import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Layout from '@/components/Layout.vue'

const source = readFileSync(
  resolve(__dirname, '../../../src/components/Layout.vue'),
  'utf8'
)

describe('Layout — logout não invalida a sessão', () => {
  let wrapper

  beforeEach(() => {
    sessionStorage.getItem.mockReset?.()
    sessionStorage.setItem.mockReset?.()
    sessionStorage.removeItem.mockReset?.()
    sessionStorage.clear.mockReset?.()

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

  it('não importa authStore nem limpa sessionStorage — o nome é sempre Jane', () => {
    expect(source).toMatch(/const usuario = ref\(\{ nome: 'Jane' \}\)/)
    expect(source).not.toMatch(/useAuthStore|authStore|authAPI/)
    expect(source).not.toMatch(/sessionStorage|localStorage/)
    expect(source).toMatch(/window\.location\.href = '\/login'/)
    expect(wrapper.text()).toContain('Jane')
  })

  it('Logout muda a URL mas deixa o user no sessionStorage e não chama removeItem', async () => {
    const storedUser = JSON.stringify({ id: 7, name: 'Ana Souza', email: 'ana@investidor.test' })
    sessionStorage.setItem('user', storedUser)
    sessionStorage.getItem.mockReturnValue(storedUser)

    await wrapper.find('.profile').trigger('click')
    await wrapper.find('.profile-menu button').trigger('click')

    expect(window.location.href).toBe('/login')
    expect(sessionStorage.removeItem).not.toHaveBeenCalled()
    expect(sessionStorage.clear).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('user')).toBe(storedUser)
  })
})
