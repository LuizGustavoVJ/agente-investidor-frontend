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

describe('Auth — success como string "false" e updateProfile sem sessão', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('login com success: "false" sem user devolve sucesso mas não autentica', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: 'false', message: 'Credenciais inválidas' }
    })

    const store = useAuthStore()
    const result = await store.login({ email: 'ana@email.com', password: 'secret' })

    expect(result).toEqual({ success: true })
    expect(store.isAuthenticated).toBe(false)
    expect(store.error).toBeNull()
  })

  it('login com success: "false" e user autentica como se tivesse dado certo', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: 'false', user: { id: 1, email: 'ana@email.com' } }
    })

    const store = useAuthStore()
    const result = await store.login({ email: 'ana@email.com', password: 'secret' })

    expect(result).toEqual({ success: true })
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual({ id: 1, email: 'ana@email.com' })
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ id: 1, email: 'ana@email.com' })
    )
  })

  it('checkAuthStatus com success: "false" e user restaura a sessão', async () => {
    sessionStorage.getItem.mockReturnValue(null)
    authAPI.checkAuth.mockResolvedValue({
      data: { success: 'false', user: { id: 9, email: 'ana@email.com' } }
    })

    const store = useAuthStore()
    const ok = await store.checkAuthStatus()

    expect(ok).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user.email).toBe('ana@email.com')
  })

  it('updateProfile com user null cria sessão a partir do payload', async () => {
    authAPI.updateProfile.mockResolvedValue({
      data: { success: true, user: { email: 'nova@email.com', name: 'Ana' } }
    })

    const store = useAuthStore()
    expect(store.user).toBeNull()

    const result = await store.updateProfile({ name: 'Ana' })

    expect(result).toEqual({ success: true })
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual({ email: 'nova@email.com', name: 'Ana' })
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ email: 'nova@email.com', name: 'Ana' })
    )
  })
})
