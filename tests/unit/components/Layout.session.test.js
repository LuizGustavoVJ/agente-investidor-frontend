import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { mount } from '@vue/test-utils'
import Layout from '@/components/Layout.vue'

vi.mock('@/api/auth', () => ({
  authAPI: {
    logout: vi.fn()
  }
}))

import { authAPI } from '@/api/auth'

const layoutSource = readFileSync(
  resolve(__dirname, '../../../src/components/Layout.vue'),
  'utf8'
)

describe('Layout — logout não invalida a sessão', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = 'http://localhost:3000/dashboard'
    wrapper = mount(Layout, {
      global: {
        stubs: {
          'router-view': { template: '<div class="outlet" />' }
        }
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('não importa a store de auth nem chama a API de logout', () => {
    expect(layoutSource).not.toContain('useAuthStore')
    expect(layoutSource).not.toContain('authAPI')
    expect(layoutSource).not.toContain('authStore.logout')
    expect(layoutSource).toContain("window.location.href = '/login'")
  })

  it('redireciona para /login sem invalidar o cookie HTTP-only', async () => {
    await wrapper.find('.profile').trigger('click')
    await wrapper.find('.profile-menu button').trigger('click')

    expect(window.location.href).toBe('/login')
    expect(authAPI.logout).not.toHaveBeenCalled()
  })
})
