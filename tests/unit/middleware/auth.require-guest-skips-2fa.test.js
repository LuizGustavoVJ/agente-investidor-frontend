import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { requireGuest } from '@/middleware/auth'

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

const routerSource = readFileSync(
  resolve(__dirname, '../../../src/router/index.js'),
  'utf8'
)
const middlewareSource = readFileSync(
  resolve(__dirname, '../../../src/middleware/auth.js'),
  'utf8'
)

describe('Auth — requireGuest manda sessão 2FA incompleta para o Dashboard', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  it('twoFactorEnabled sem twoFactorVerified ainda é isAuthenticated e sai de /login', async () => {
    authStore.user = {
      id: 9,
      email: 'ana@exemplo.com',
      twoFactorEnabled: true,
      emailVerified: false
    }
    authStore.isInitialized = true

    const next = vi.fn()
    await requireGuest(
      { name: 'Login', path: '/login', fullPath: '/login' },
      {},
      next
    )

    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user.twoFactorVerified).toBeUndefined()
    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith({ name: 'Dashboard' })
  })

  it('router aplica requireGuest em /login e /cadastro sem checar 2FA ou e-mail', () => {
    expect(routerSource).toMatch(/path: '\/login'[\s\S]*?beforeEnter: requireGuest/)
    expect(routerSource).toMatch(/path: '\/cadastro'[\s\S]*?beforeEnter: requireGuest/)
    expect(routerSource).not.toMatch(/beforeEnter: requireEmailVerified/)
    expect(routerSource).not.toMatch(/beforeEnter: requireCompleteProfile/)

    const guestFn = middlewareSource.slice(
      middlewareSource.indexOf('export const requireGuest'),
      middlewareSource.indexOf('export const requirePermission')
    )
    expect(guestFn).toMatch(/isAuthenticated/)
    expect(guestFn).toMatch(/name: 'Dashboard'/)
    expect(guestFn).not.toMatch(/twoFactor|emailVerified|verify2FA/)
  })
})
