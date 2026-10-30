import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
    updateProfile: vi.fn(),
    refreshToken: vi.fn()
  }
}))

const storeSource = readFileSync(resolve(__dirname, '../../../src/stores/auth.js'), 'utf8')
const authApiSource = readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8')
const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')

const userWithToken = {
  id: 9,
  name: 'Ana Lima',
  email: 'ana@exemplo.com',
  token: 'jwt-sessao-abc'
}

describe('Auth — refreshToken e Bearer existem na API e somem na store', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
    sessionStorage.getItem.mockReturnValue(null)
  })

  it('API tem refreshToken POST /auth/refresh; store não expõe a action', () => {
    expect(authApiSource).toMatch(/refreshToken/)
    expect(authApiSource).toMatch(/\/auth\/refresh/)
    expect(typeof authAPI.refreshToken).toBe('function')

    expect(authStore.refreshToken).toBeUndefined()
    expect(storeSource).not.toMatch(/refreshToken/)
    expect(storeSource).not.toMatch(/setAuthHeader/)
    expect(clientSource).toMatch(/client\.post\('\/auth\/refresh'\)/)
    expect(clientSource).not.toMatch(/authAPI\.refreshToken/)
  })

  it('login sucesso persiste user.token no sessionStorage e não chama refreshToken nem seta Bearer', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: userWithToken }
    })

    const result = await authStore.login({
      email: userWithToken.email,
      password: 'senha-forte'
    })

    expect(result).toEqual({ success: true })
    expect(authStore.user).toEqual(userWithToken)
    expect(authStore.user.token).toBe('jwt-sessao-abc')
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(userWithToken)
    )
    expect(authAPI.refreshToken).not.toHaveBeenCalled()
    expect(authStore.refreshToken).toBeUndefined()
    expect(authStore.setAuthHeader).toBeUndefined()
  })

  it('checkAuthStatus hidrata o token e também não renova sessão via refreshToken', async () => {
    authAPI.checkAuth.mockResolvedValue({
      data: { success: true, user: userWithToken }
    })

    const ok = await authStore.checkAuthStatus()

    expect(ok).toBe(true)
    expect(authStore.user.token).toBe('jwt-sessao-abc')
    expect(authAPI.refreshToken).not.toHaveBeenCalled()
    expect(authStore.refreshToken).toBeUndefined()
  })
})
