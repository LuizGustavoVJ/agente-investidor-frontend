import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'
import { requireAuth } from '@/middleware/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

const sessionUser = {
  id: 42,
  name: 'Ana Souza',
  email: 'ana@investidor.test',
  emailVerified: true
}

describe('Auth — login não marca isInitialized e o próximo guard pode apagar a sessão', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('login com sucesso hidrata o usuário e deixa isInitialized=false', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: sessionUser }
    })

    const result = await authStore.login({
      email: sessionUser.email,
      password: 'senha-segura'
    })

    expect(result).toEqual({ success: true })
    expect(authStore.user).toEqual(sessionUser)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.isInitialized).toBe(false)
    expect(authAPI.checkAuth).not.toHaveBeenCalled()
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(sessionUser)
    )
  })

  it('requireAuth após login chama /auth/me; falha de rede apaga a sessão nova e devolve ao Login', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: sessionUser }
    })
    await authStore.login({
      email: sessionUser.email,
      password: 'senha-segura'
    })

    expect(authStore.isInitialized).toBe(false)
    expect(authStore.isAuthenticated).toBe(true)

    sessionStorage.getItem.mockReturnValue(JSON.stringify(sessionUser))
    authAPI.checkAuth.mockRejectedValue({ message: 'Network Error' })

    const next = vi.fn()
    await requireAuth(
      { fullPath: '/dashboard', name: 'Dashboard' },
      { name: 'Login' },
      next
    )

    expect(authAPI.checkAuth).toHaveBeenCalledTimes(1)
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isInitialized).toBe(true)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/dashboard' }
    })
  })
})
