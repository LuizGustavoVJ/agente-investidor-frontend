import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'
import { requirePermission } from '@/middleware/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn(),
    refreshToken: vi.fn()
  }
}))

const privilegedUser = {
  id: 9,
  name: 'Ana Lima',
  email: 'ana@exemplo.com',
  role: 'admin',
  permissions: ['admin', 'users:delete', '*']
}

describe('Auth — login hidrata role/permissions sem GET /auth/me', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('sucesso do login grava role admin e permissões sem chamar /auth/me', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: privilegedUser }
    })

    const result = await authStore.login({
      email: 'ana@exemplo.com',
      password: 'senha-local-teste'
    })

    expect(result).toEqual({ success: true })
    expect(authAPI.checkAuth).not.toHaveBeenCalled()
    expect(authAPI.refreshToken).not.toHaveBeenCalled()

    expect(authStore.user).toEqual(privilegedUser)
    expect(authStore.user.role).toBe('admin')
    expect(authStore.user.permissions).toEqual(['admin', 'users:delete', '*'])
    expect(authStore.isAuthenticated).toBe(true)

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(privilegedUser)
    )
  })

  it('requirePermission libera a rota com as permissões vindas do POST /auth/login', async () => {
    authStore.user = privilegedUser
    const next = vi.fn()

    await requirePermission('users:delete')(
      { fullPath: '/configuracoes' },
      {},
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0]).toEqual([])
    expect(authAPI.checkAuth).not.toHaveBeenCalled()
  })
})
