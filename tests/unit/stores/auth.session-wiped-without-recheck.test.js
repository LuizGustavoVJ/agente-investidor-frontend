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

describe('Auth — sessão destruída sem revalidar o cookie', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('checkAuthStatus com erro de rede apaga usuário autenticado e o sessionStorage', async () => {
    const sessionUser = { id: 9, name: 'Ana Souza', email: 'ana@investidor.test' }
    authStore.user = { ...sessionUser }
    sessionStorage.getItem.mockReturnValue(JSON.stringify(sessionUser))
    authAPI.checkAuth.mockRejectedValue({ message: 'Network Error' })

    const ok = await authStore.checkAuthStatus()

    expect(ok).toBe(false)
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isInitialized).toBe(true)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    expect(authAPI.checkAuth).toHaveBeenCalledTimes(1)
  })

  it('checkAuthStatus com HTTP 500 também encerra a sessão local', async () => {
    authStore.user = { id: 3, name: 'Bruno', email: 'bruno@investidor.test' }
    sessionStorage.getItem.mockReturnValue(JSON.stringify(authStore.user))
    authAPI.checkAuth.mockRejectedValue({
      response: { status: 500, data: { message: 'erro interno' } }
    })

    const ok = await authStore.checkAuthStatus()

    expect(ok).toBe(false)
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('logout com API em falha zera o usuário e initialize não chama checkAuth de novo', async () => {
    authStore.user = { id: 9, name: 'Ana Souza', email: 'ana@investidor.test' }
    authStore.isInitialized = true
    authAPI.logout.mockRejectedValue({ message: 'Network Error' })

    await authStore.logout()

    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isInitialized).toBe(true)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')

    authAPI.checkAuth.mockClear()
    await authStore.initialize()

    expect(authAPI.checkAuth).not.toHaveBeenCalled()
    expect(authStore.user).toBeNull()
    expect(authStore.isInitialized).toBe(true)
  })
})
