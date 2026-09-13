import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import { authAPI } from '@/api/auth'

describe('Auth store — auto-login após cadastro', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset?.()
    sessionStorage.setItem.mockReset?.()
    sessionStorage.removeItem.mockReset?.()
  })

  it('cadastro ok + login falho devolve erro e deixa o cliente sem sessão', async () => {
    authAPI.register.mockResolvedValue({ data: { success: true } })
    authAPI.login.mockResolvedValue({
      data: { success: false, message: 'Credenciais inválidas' }
    })

    const store = useAuthStore()
    const result = await store.register({
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'SenhaForte1'
    })

    expect(authAPI.register).toHaveBeenCalled()
    expect(authAPI.login).toHaveBeenCalledWith({
      email: 'joao@email.com',
      password: 'SenhaForte1'
    })
    expect(result.success).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
  })

  it('cadastro ok + login ok hidrata user e sessionStorage', async () => {
    const user = { id: 'u-1', name: 'João Silva', email: 'joao@email.com' }
    authAPI.register.mockResolvedValue({ data: { success: true } })
    authAPI.login.mockResolvedValue({ data: { success: true, user } })

    const store = useAuthStore()
    const result = await store.register({
      email: 'joao@email.com',
      password: 'SenhaForte1'
    })

    expect(result.success).toBe(true)
    expect(store.user).toEqual(user)
    expect(store.isAuthenticated).toBe(true)
    expect(sessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user))
  })
})
