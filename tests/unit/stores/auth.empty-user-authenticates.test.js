import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import { authAPI } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

describe('Auth: user vazio autentica; success sem user encerra a sessão', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('login success com user:{} deixa isAuthenticated true e grava "{}" no sessionStorage', async () => {
    const store = useAuthStore()
    authAPI.login.mockResolvedValue({ data: { success: true, user: {} } })

    const result = await store.login({ email: 'ana@ex.com', password: 'segredo' })

    expect(result).toEqual({ success: true })
    expect(store.user).toEqual({})
    expect(store.isAuthenticated).toBe(true)
    expect(sessionStorage.setItem).toHaveBeenCalledWith('user', '{}')
  })

  it('checkAuth success com user:{} hidrata sessão autenticada sem perfil', async () => {
    const store = useAuthStore()
    sessionStorage.getItem.mockReturnValue(null)
    authAPI.checkAuth.mockResolvedValue({ data: { success: true, user: {} } })

    const authenticated = await store.checkAuthStatus()

    expect(authenticated).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual({})
    expect(sessionStorage.setItem).toHaveBeenCalledWith('user', '{}')
  })

  it('checkAuth success:true sem campo user descarta a sessão hidratada do sessionStorage', async () => {
    const store = useAuthStore()
    sessionStorage.getItem.mockReturnValue(JSON.stringify({ id: 9, name: 'Ana' }))
    authAPI.checkAuth.mockResolvedValue({ data: { success: true } })

    const authenticated = await store.checkAuthStatus()

    expect(authenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
  })
})
