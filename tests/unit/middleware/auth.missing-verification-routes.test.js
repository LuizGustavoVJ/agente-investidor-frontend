import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import {
  requireEmailVerified,
  requireCompleteProfile,
  requirePermission
} from '@/middleware/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    checkAuth: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

const routerSource = readFileSync(resolve(__dirname, '../../../src/router/index.js'), 'utf8')

describe('Auth middleware — destinos EmailVerification e ProfileSetup não existem', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
  })

  it('router/index.js não registra EmailVerification nem ProfileSetup', () => {
    expect(routerSource).not.toMatch(/name:\s*['"]EmailVerification['"]/)
    expect(routerSource).not.toMatch(/name:\s*['"]ProfileSetup['"]/)
    expect(routerSource).not.toMatch(/path:\s*['"]\/verificar-email['"]/)
    expect(routerSource).not.toMatch(/path:\s*['"]\/completar-perfil['"]/)
    expect(routerSource).toMatch(/name:\s*['"]Forbidden['"]/)
    expect(routerSource).toMatch(/name:\s*['"]Login['"]/)
  })

  it('requireEmailVerified redireciona usuário autenticado sem verificação para rota inexistente', async () => {
    authStore.user = { id: 7, email: 'ana@exemplo.com', emailVerified: false }
    const next = vi.fn()

    await requireEmailVerified(
      { fullPath: '/dashboard' },
      { name: 'Home' },
      next
    )

    expect(next).toHaveBeenCalledWith({
      name: 'EmailVerification',
      query: { redirect: '/dashboard' }
    })
  })

  it('requireCompleteProfile trata firstName como perfil incompleto e aponta para ProfileSetup ausente', async () => {
    authStore.user = {
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@exemplo.com',
      phone: '11999999999'
    }
    const next = vi.fn()

    await requireCompleteProfile(
      { fullPath: '/configuracoes' },
      { name: 'Dashboard' },
      next
    )

    expect(authStore.user.name).toBeUndefined()
    expect(next).toHaveBeenCalledWith({
      name: 'ProfileSetup',
      query: { redirect: '/configuracoes' }
    })
  })

  it('requirePermission não chama initialize — sessão ainda não hidratada cai no login', async () => {
    const initializeSpy = vi.spyOn(authStore, 'initialize')
    expect(authStore.isInitialized).toBe(false)
    expect(authStore.isAuthenticated).toBe(false)

    const next = vi.fn()
    await requirePermission('manage_portfolio')(
      { fullPath: '/relatorios' },
      { name: 'Dashboard' },
      next
    )

    expect(initializeSpy).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/relatorios' }
    })
  })
})
