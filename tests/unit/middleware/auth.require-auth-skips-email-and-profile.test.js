import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { requireAuth } from '@/middleware/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    checkAuth: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

const routerSource = readFileSync(
  resolve(__dirname, '../../../src/router/index.js'),
  'utf8'
)

describe('Auth — requireAuth não exige e-mail verificado nem perfil completo', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
  })

  it('router só aplica requireAuth/requireGuest — requireEmailVerified e requireCompleteProfile não entram nas rotas', () => {
    expect(routerSource).toMatch(/beforeEnter:\s*requireAuth/)
    expect(routerSource).toMatch(/beforeEnter:\s*requireGuest/)
    expect(routerSource).not.toMatch(/requireEmailVerified/)
    expect(routerSource).not.toMatch(/requireCompleteProfile/)
    expect(routerSource).not.toMatch(/requirePermission/)
    expect(routerSource).toMatch(/path:\s*['"]\/dashboard['"]/)
  })

  it('requireAuth libera /dashboard para sessão sem e-mail verificado, sem name e sem phone', async () => {
    authStore.isInitialized = true
    authStore.user = {
      id: 7,
      email: 'pendente@investidor.test',
      emailVerified: false,
      firstName: 'Ana'
    }

    const next = vi.fn()
    await requireAuth(
      { fullPath: '/dashboard', name: 'Dashboard' },
      { name: 'Login' },
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user.emailVerified).toBe(false)
    expect(authStore.user.name).toBeUndefined()
    expect(authStore.user.phone).toBeUndefined()
  })
})
