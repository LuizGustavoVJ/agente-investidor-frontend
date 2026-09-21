import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const checkAuth = vi.fn()
const logout = vi.fn()

vi.mock('@/api/auth', () => ({
  authAPI: {
    checkAuth: (...args) => checkAuth(...args),
    logout: (...args) => logout(...args),
    login: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import { useAuthStore } from '@/stores/auth'

describe('Auth store — logout não reseta isInitialized', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.removeItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.getItem.mockReturnValue(null)
  })

  it('logout com falha da API limpa o usuário mas initialize posterior não reconsulta /auth/me', async () => {
    checkAuth.mockResolvedValue({
      data: { success: true, user: { id: 1, email: 'ana@email.com' } }
    })
    const store = useAuthStore()
    await store.checkAuthStatus()
    expect(store.isAuthenticated).toBe(true)
    expect(store.isInitialized).toBe(true)

    logout.mockRejectedValue(new Error('network'))
    await store.logout()

    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isInitialized).toBe(true)

    checkAuth.mockClear()
    await store.initialize()

    expect(checkAuth).not.toHaveBeenCalled()
    expect(store.isAuthenticated).toBe(false)
  })

  it('logout bem-sucedido também deixa isInitialized true', async () => {
    checkAuth.mockResolvedValue({
      data: { success: true, user: { id: 2, email: 'joao@email.com' } }
    })
    logout.mockResolvedValue({ data: { success: true } })
    const store = useAuthStore()
    await store.checkAuthStatus()

    await store.logout()

    expect(store.isInitialized).toBe(true)
    expect(store.user).toBeNull()
  })
})
