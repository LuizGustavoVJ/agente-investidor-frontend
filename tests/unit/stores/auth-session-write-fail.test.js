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

describe('Auth store — persistência de sessão e payload sem user', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
    sessionStorage.getItem.mockReturnValue(null)
  })

  it('setItem lançando depois do login deixa isAuthenticated true e o retorno como falha', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: { id: 9, email: 'ana@email.com' } }
    })
    sessionStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const store = useAuthStore()
    const result = await store.login({
      email: 'ana@email.com',
      password: 'senha123'
    })

    expect(store.user).toEqual({ id: 9, email: 'ana@email.com' })
    expect(store.isAuthenticated).toBe(true)
    expect(result.success).toBe(false)
    expect(store.error).toContain('QuotaExceededError')
  })

  it('checkAuth success:true sem user apaga a sessão restaurada do sessionStorage', async () => {
    sessionStorage.getItem.mockReturnValue(
      JSON.stringify({ id: 3, email: 'joao@email.com' })
    )
    authAPI.checkAuth.mockResolvedValue({
      data: { success: true }
    })

    const store = useAuthStore()
    const ok = await store.checkAuthStatus()

    expect(ok).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('updateProfile com permissions:null apaga as permissões locais', async () => {
    const store = useAuthStore()
    store.user = {
      id: 1,
      email: 'ana@email.com',
      permissions: ['brokers:manage', 'portfolio:read']
    }
    authAPI.updateProfile.mockResolvedValue({
      data: {
        success: true,
        user: { name: 'Ana', permissions: null }
      }
    })

    const result = await store.updateProfile({ name: 'Ana' })

    expect(result.success).toBe(true)
    expect(store.user.permissions).toBeNull()
    expect(store.user.email).toBe('ana@email.com')
  })
})
