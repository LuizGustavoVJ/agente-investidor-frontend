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

const liveUser = {
  id: 9,
  name: 'Ana Lima',
  email: 'ana@exemplo.com',
  token: 'jwt-ainda-valido'
}

describe('Auth — checkAuth em voo restaura a sessão depois do logout', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
    sessionStorage.getItem.mockReturnValue(null)
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/dashboard',
        origin: 'http://localhost:3000',
        pathname: '/dashboard',
        search: '',
        hash: '',
        reload: vi.fn(),
        assign: vi.fn()
      },
      writable: true
    })
  })

  it('logout zera o user; /auth/me que já estava em voo grava de novo e persiste o token', async () => {
    let resolveCheck
    authAPI.checkAuth.mockImplementation(
      () => new Promise((resolve) => {
        resolveCheck = resolve
      })
    )
    authAPI.logout.mockResolvedValue({ data: { success: true } })

    const pendingCheck = authStore.checkAuthStatus()

    authStore.user = { ...liveUser }
    expect(authStore.isAuthenticated).toBe(true)

    await authStore.logout()

    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')

    resolveCheck({ data: { success: true, user: liveUser } })
    const stillAuthed = await pendingCheck

    expect(stillAuthed).toBe(true)
    expect(authStore.user).toEqual(liveUser)
    expect(authStore.user.token).toBe('jwt-ainda-valido')
    expect(authStore.isAuthenticated).toBe(true)
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(liveUser)
    )
  })
})
