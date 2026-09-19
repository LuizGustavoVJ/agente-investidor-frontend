import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const checkAuth = vi.fn()

vi.mock('@/api/auth', () => ({
  authAPI: {
    checkAuth: (...args) => checkAuth(...args),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import { useAuthStore } from '@/stores/auth'

describe('Auth store — sessionStorage corrompido', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.removeItem.mockReset()
    sessionStorage.setItem.mockReset()
  })

  it('JSON inválido aborta checkAuth e trata o usuário como deslogado', async () => {
    sessionStorage.getItem.mockReturnValue('{nao-e-json')
    const store = useAuthStore()

    const result = await store.checkAuthStatus()

    expect(result).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(checkAuth).not.toHaveBeenCalled()
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('string "undefined" também quebra o parse e nunca consulta /auth/me', async () => {
    sessionStorage.getItem.mockReturnValue('undefined')
    const store = useAuthStore()

    const result = await store.checkAuthStatus()

    expect(result).toBe(false)
    expect(checkAuth).not.toHaveBeenCalled()
  })
})
