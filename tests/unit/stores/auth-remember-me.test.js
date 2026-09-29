import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    refreshToken: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import { authAPI } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

describe('Auth — rememberMe do Login chega na API e é descartado no payload HTTP', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('store.login encaminha rememberMe para authAPI.login (o checkbox não é dropado na store)', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: { id: 1, email: 'a@b.com' } }
    })

    const result = await store.login({
      email: 'a@b.com',
      password: 'secret12',
      rememberMe: true
    })

    expect(result.success).toBe(true)
    expect(authAPI.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret12',
      rememberMe: true
    })
  })
})
