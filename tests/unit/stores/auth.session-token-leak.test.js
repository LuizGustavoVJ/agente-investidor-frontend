import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('Auth — login/checkAuth persistem token no sessionStorage', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
    sessionStorage.getItem.mockReturnValue(null)
  })

  it('login sucesso grava user.token no sessionStorage embora o comentário diga só dados não sensíveis', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        success: true,
        user: {
          id: 9,
          name: 'Ana Lima',
          email: 'ana@exemplo.com',
          token: 'secret-jwt-login'
        }
      }
    })

    const result = await authStore.login({
      email: 'ana@exemplo.com',
      password: 'senha-forte'
    })

    expect(result).toEqual({ success: true })
    expect(authStore.user.token).toBe('secret-jwt-login')
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({
        id: 9,
        name: 'Ana Lima',
        email: 'ana@exemplo.com',
        token: 'secret-jwt-login'
      })
    )
  })

  it('checkAuthStatus sucesso também persiste refreshToken devolvido pelo /auth/me', async () => {
    authAPI.checkAuth.mockResolvedValue({
      data: {
        success: true,
        user: {
          id: 9,
          name: 'Ana Lima',
          refreshToken: 'secret-refresh'
        }
      }
    })

    const ok = await authStore.checkAuthStatus()

    expect(ok).toBe(true)
    expect(authStore.user.refreshToken).toBe('secret-refresh')
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      expect.stringContaining('secret-refresh')
    )
  })
})
