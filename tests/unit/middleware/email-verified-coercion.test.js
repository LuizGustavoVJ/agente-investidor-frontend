import { describe, it, expect, beforeEach, vi } from 'vitest'

const authStore = vi.hoisted(() => ({
  isAuthenticated: true,
  isInitialized: true,
  user: null,
  initialize: vi.fn()
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore
}))

import { requireEmailVerified } from '@/middleware/auth'

describe('requireEmailVerified — coerção truthy/falsy', () => {
  const next = vi.fn()
  const to = { fullPath: '/dashboard' }
  const from = { fullPath: '/login' }

  beforeEach(() => {
    vi.clearAllMocks()
    authStore.isAuthenticated = true
    authStore.isInitialized = true
    authStore.user = null
  })

  it('string "false" é truthy e libera a rota (não redireciona para verificação)', async () => {
    authStore.user = { email: 'ana@email.com', emailVerified: 'false' }

    await requireEmailVerified(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('número 0 é falsy e manda para EmailVerification', async () => {
    authStore.user = { email: 'ana@email.com', emailVerified: 0 }

    await requireEmailVerified(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'EmailVerification',
      query: { redirect: '/dashboard' }
    })
  })
})
