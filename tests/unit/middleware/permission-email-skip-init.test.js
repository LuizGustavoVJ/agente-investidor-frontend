import { describe, it, expect, beforeEach, vi } from 'vitest'

const authStore = vi.hoisted(() => ({
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  initialize: vi.fn()
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore
}))

import { requirePermission, requireEmailVerified } from '@/middleware/auth'

describe('requirePermission / requireEmailVerified — pulam initialize', () => {
  const next = vi.fn()
  const to = { fullPath: '/relatorios' }
  const from = { fullPath: '/' }

  beforeEach(() => {
    vi.clearAllMocks()
    authStore.isAuthenticated = false
    authStore.isInitialized = false
    authStore.user = null
    authStore.initialize.mockImplementation(async () => {
      authStore.isAuthenticated = true
      authStore.isInitialized = true
      authStore.user = {
        email: 'ana@exemplo.com',
        emailVerified: true,
        permissions: ['reports']
      }
    })
  })

  it('requirePermission manda para Login sem hidratar sessão persistida', async () => {
    await requirePermission('reports')(to, from, next)

    expect(authStore.initialize).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/relatorios' }
    })
  })

  it('requireEmailVerified manda para Login sem hidratar sessão persistida', async () => {
    await requireEmailVerified(to, from, next)

    expect(authStore.initialize).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/relatorios' }
    })
  })

  it('requireAuth hidrata e deixaria passar — contraste com os guards acima', async () => {
    const { requireAuth } = await import('@/middleware/auth')
    await requireAuth(to, from, next)

    expect(authStore.initialize).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
  })
})
