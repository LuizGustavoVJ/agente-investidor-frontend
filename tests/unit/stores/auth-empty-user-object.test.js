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
import { requireCompleteProfile } from '@/middleware/auth'

describe('Auth — login success com user vazio {}', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('user {} deixa isAuthenticated true e grava "{}" na sessão', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: {} }
    })

    const store = useAuthStore()
    const result = await store.login({ email: 'a@b.com', password: '123456' })

    expect(result).toEqual({ success: true })
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual({})
    expect(sessionStorage.setItem).toHaveBeenCalledWith('user', '{}')
  })

  it('requireCompleteProfile redireciona perfil vazio para ProfileSetup', async () => {
    const store = useAuthStore()
    store.user = {}

    const next = vi.fn()
    await requireCompleteProfile(
      { fullPath: '/dashboard' },
      {},
      next
    )

    expect(next).toHaveBeenCalledWith({
      name: 'ProfileSetup',
      query: { redirect: '/dashboard' }
    })
  })
})
