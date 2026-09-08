import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  isInitialized: false,
  isAuthenticated: false,
  user: null,
  initialize: vi.fn(async () => {
    authState.isInitialized = true
  })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authState
}))

import {
  requirePermission,
  requireEmailVerified,
  requireCompleteProfile
} from '@/middleware/auth'

const createRoute = (overrides = {}) => ({
  name: 'Dashboard',
  fullPath: '/dashboard',
  path: '/dashboard',
  ...overrides
})

describe('Guards que não hidratam a sessão antes de decidir', () => {
  let next

  beforeEach(() => {
    next = vi.fn()
    authState.isInitialized = false
    authState.isAuthenticated = false
    authState.user = null
    authState.initialize.mockClear()
  })

  it('requirePermission não chama initialize e manda para login se a store ainda não hidratou', async () => {
    const guard = requirePermission('brokers:manage')

    await guard(createRoute({ fullPath: '/corretoras' }), createRoute({ name: 'Home' }), next)

    expect(authState.initialize).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/corretoras' }
    })
  })

  it('requireEmailVerified não chama initialize antes de bloquear visitante', async () => {
    await requireEmailVerified(
      createRoute({ fullPath: '/analises' }),
      createRoute({ name: 'Home' }),
      next
    )

    expect(authState.initialize).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/analises' }
    })
  })

  it('requireCompleteProfile não chama initialize antes de bloquear visitante', async () => {
    await requireCompleteProfile(
      createRoute({ fullPath: '/configuracoes' }),
      createRoute({ name: 'Home' }),
      next
    )

    expect(authState.initialize).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/configuracoes' }
    })
  })
})
