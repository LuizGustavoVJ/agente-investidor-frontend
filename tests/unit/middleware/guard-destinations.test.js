import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const authState = vi.hoisted(() => ({
  isInitialized: true,
  isAuthenticated: true,
  user: null,
  initialize: vi.fn()
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authState
}))

import { requireEmailVerified, requireCompleteProfile, requirePermission } from '@/middleware/auth'

const routerSource = readFileSync(resolve(__dirname, '../../../src/router/index.js'), 'utf8')
const middlewareSource = readFileSync(resolve(__dirname, '../../../src/middleware/auth.js'), 'utf8')

const namedRoutes = [...routerSource.matchAll(/name:\s*'([^']+)'/g)].map((match) => match[1])

const createRoute = (overrides = {}) => ({
  name: 'Dashboard',
  fullPath: '/dashboard',
  path: '/dashboard',
  ...overrides
})

describe('Guards — destinos nomeados e perfil incompleto', () => {
  let next

  beforeEach(() => {
    next = vi.fn()
    authState.isInitialized = true
    authState.isAuthenticated = true
    authState.user = {
      name: 'João',
      email: 'joao@email.com',
      phone: '11999999999',
      emailVerified: true,
      permissions: []
    }
  })

  it('middleware aponta para EmailVerification e ProfileSetup, rotas ausentes no router', () => {
    expect(middlewareSource).toContain("name: 'EmailVerification'")
    expect(middlewareSource).toContain("name: 'ProfileSetup'")
    expect(namedRoutes).not.toContain('EmailVerification')
    expect(namedRoutes).not.toContain('ProfileSetup')
  })

  it('requireEmailVerified redireciona para rota nomeada que o router não registra', async () => {
    authState.user = { ...authState.user, emailVerified: false }

    await requireEmailVerified(createRoute({ fullPath: '/analises' }), createRoute(), next)

    expect(next).toHaveBeenCalledWith({
      name: 'EmailVerification',
      query: { redirect: '/analises' }
    })
    expect(namedRoutes).not.toContain('EmailVerification')
  })

  it('requireCompleteProfile trata espaço em branco como perfil completo', async () => {
    authState.user = {
      name: '   ',
      email: '   ',
      phone: '   '
    }

    await requireCompleteProfile(createRoute({ fullPath: '/configuracoes' }), createRoute(), next)

    expect(next).toHaveBeenCalledWith()
    expect(next).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ProfileSetup' })
    )
  })

  it('requirePermission manda para Forbidden, nome registrado com view lazy inexistente', async () => {
    const guard = requirePermission('brokers:manage')

    await guard(createRoute({ fullPath: '/corretoras' }), createRoute(), next)

    expect(next).toHaveBeenCalledWith({
      name: 'Forbidden',
      params: { requiredPermission: 'brokers:manage' }
    })
    expect(namedRoutes).toContain('Forbidden')
    expect(routerSource).toContain("import('@/views/Forbidden.vue')")
  })
})
