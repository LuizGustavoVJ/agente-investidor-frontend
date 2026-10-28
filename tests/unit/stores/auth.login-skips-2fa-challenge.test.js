import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
    updateProfile: vi.fn(),
    verify2FA: vi.fn(),
    get2FAQRCode: vi.fn(),
    toggle2FA: vi.fn()
  }
}))

const loginSource = readFileSync(
  resolve(__dirname, '../../../src/components/Login.vue'),
  'utf8'
)
const middlewareSource = readFileSync(
  resolve(__dirname, '../../../src/middleware/auth.js'),
  'utf8'
)
const storeSource = readFileSync(
  resolve(__dirname, '../../../src/stores/auth.js'),
  'utf8'
)

const twoFactorUser = {
  id: 9,
  name: 'Ana Lima',
  email: 'ana@exemplo.com',
  twoFactorEnabled: true
}

describe('Auth — login com 2FA ativo libera a sessão sem verify2FA', () => {
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

  it('Login.vue e a store não têm passo de 2FA; a API de verificação existe e não é usada', () => {
    expect(loginSource).not.toMatch(/totp|twoFactor|2fa|verify2FA/i)
    expect(loginSource).toMatch(/email: form\.value\.email/)
    expect(loginSource).toMatch(/password: form\.value\.password/)
    expect(storeSource).not.toMatch(/verify2FA/)
    expect(middlewareSource).not.toMatch(/twoFactor/)
    expect(typeof authAPI.verify2FA).toBe('function')
    expect(authStore.verify2FA).toBeUndefined()
    expect(authStore.toggle2FA).toBeUndefined()
    expect(authStore.get2FAQRCode).toBeUndefined()
  })

  it('login sucesso com twoFactorEnabled hidrata o usuário e não chama verify2FA', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: twoFactorUser }
    })

    const result = await authStore.login({
      email: twoFactorUser.email,
      password: 'senha-forte',
      totp: '123456'
    })

    expect(result).toEqual({ success: true })
    expect(authStore.user).toEqual(twoFactorUser)
    expect(authStore.user.twoFactorEnabled).toBe(true)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authAPI.verify2FA).not.toHaveBeenCalled()
    expect(authAPI.get2FAQRCode).not.toHaveBeenCalled()
    expect(authAPI.toggle2FA).not.toHaveBeenCalled()
  })

  it('requireAuth libera /dashboard com 2FA ligado e sem twoFactorVerified', async () => {
    authStore.user = { ...twoFactorUser }
    authStore.isInitialized = true

    const next = vi.fn()
    await requireAuth(
      { fullPath: '/dashboard', name: 'Dashboard' },
      { name: 'Login' },
      next
    )

    expect(authAPI.checkAuth).not.toHaveBeenCalled()
    expect(authAPI.verify2FA).not.toHaveBeenCalled()
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user.twoFactorVerified).toBeUndefined()
    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0][0]).toBeUndefined()
  })
})
