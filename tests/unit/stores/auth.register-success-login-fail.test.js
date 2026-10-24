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

const newUser = {
  name: 'Ana Souza',
  email: 'ana@investidor.test',
  password: 'SenhaForte1',
  confirmPassword: 'SenhaForte1',
  phone: '(11) 98888-7777',
  acceptTerms: true
}

describe('Auth — register cria a conta e o login seguinte pode deixar a sessão vazia', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('register com API ok e login em Network Error devolve falha, sem user e sem isInitialized', async () => {
    authAPI.register.mockResolvedValue({
      data: { success: true, message: 'Conta criada' }
    })
    authAPI.login.mockRejectedValue({
      message: 'Network Error'
    })

    const result = await authStore.register(newUser)

    expect(authAPI.register).toHaveBeenCalledTimes(1)
    expect(authAPI.register).toHaveBeenCalledWith(newUser)
    expect(authAPI.login).toHaveBeenCalledTimes(1)
    expect(authAPI.login).toHaveBeenCalledWith({
      email: newUser.email,
      password: newUser.password
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network Error')
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isInitialized).toBe(false)
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
    expect(authAPI.checkAuth).not.toHaveBeenCalled()
  })

  it('register ok e login com success:false também não hidrata a sessão', async () => {
    authAPI.register.mockResolvedValue({
      data: { success: true }
    })
    authAPI.login.mockResolvedValue({
      data: { success: false, message: 'Credenciais inválidas' }
    })

    const result = await authStore.register(newUser)

    expect(result).toEqual({
      success: false,
      error: 'Credenciais inválidas'
    })
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.error).toBe('Credenciais inválidas')
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
  })
})
