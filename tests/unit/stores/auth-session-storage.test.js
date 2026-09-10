import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const authAPI = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  updateProfile: vi.fn()
}))

vi.mock('@/api/auth', () => ({ authAPI }))

import { useAuthStore } from '@/stores/auth'

describe('Auth store — sessionStorage e hidratação', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('JSON inválido no sessionStorage não autentica', async () => {
    sessionStorage.getItem.mockReturnValue('{nao-json')
    authAPI.checkAuth.mockResolvedValue({
      data: { success: true, user: { id: 'u-1', email: 'ok@email.com' } }
    })

    const store = useAuthStore()
    const result = await store.checkAuthStatus()

    expect(result).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(authAPI.checkAuth).not.toHaveBeenCalled()
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('hidrata usuário do sessionStorage antes da API confirmar o cookie', async () => {
    const cached = { id: 'stale', email: 'stale@email.com', name: 'Cache' }
    sessionStorage.getItem.mockReturnValue(JSON.stringify(cached))

    let resolveAuth
    authAPI.checkAuth.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAuth = resolve
        })
    )

    const store = useAuthStore()
    const pending = store.checkAuthStatus()

    await Promise.resolve()

    expect(store.user).toEqual(cached)
    expect(store.isAuthenticated).toBe(true)

    resolveAuth({ data: { success: false } })
    const result = await pending

    expect(result).toBe(false)
    expect(store.user).toBeNull()
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('cookie inválido limpa sessão mesmo com cache local', async () => {
    sessionStorage.getItem.mockReturnValue(
      JSON.stringify({ id: 'stale', email: 'stale@email.com' })
    )
    authAPI.checkAuth.mockRejectedValue(new Error('network'))

    const store = useAuthStore()
    const result = await store.checkAuthStatus()

    expect(result).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isInitialized).toBe(true)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
  })
})
