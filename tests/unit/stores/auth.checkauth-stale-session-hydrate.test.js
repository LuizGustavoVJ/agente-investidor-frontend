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

const staleUser = {
  id: 9,
  name: 'Ana Lima',
  email: 'ana@exemplo.com',
  token: 'jwt-stale-session',
  emailVerified: true
}

describe('Auth — checkAuth hidrata sessionStorage antes de /auth/me', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
    sessionStorage.getItem.mockReturnValue(JSON.stringify(staleUser))
  })

  it('usuário stale fica autenticado enquanto /auth/me ainda não respondeu', async () => {
    let resolveCheck
    authAPI.checkAuth.mockImplementation(
      () => new Promise((resolve) => {
        resolveCheck = resolve
      })
    )

    const pending = authStore.checkAuthStatus()

    expect(authStore.user).toEqual(staleUser)
    expect(authStore.user.token).toBe('jwt-stale-session')
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.isInitialized).toBe(false)

    resolveCheck({ data: { success: false } })
    const ok = await pending

    expect(ok).toBe(false)
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isInitialized).toBe(true)
  })

  it('/auth/me pendente deixa a sessão stale autenticada — não há timeout nem abort', async () => {
    authAPI.checkAuth.mockImplementation(() => new Promise(() => {}))

    const pending = authStore.checkAuthStatus()

    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user.email).toBe('ana@exemplo.com')
    expect(authStore.isLoading).toBe(true)
    expect(authStore.isInitialized).toBe(false)

    pending.catch(() => {})
  })
})
