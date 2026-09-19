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

import {
  requireCompleteProfile,
  requireEmailVerified,
  requirePermission
} from '@/middleware/auth'

describe('Middleware — perfil, e-mail e permissão', () => {
  const next = vi.fn()
  const to = { fullPath: '/dashboard' }
  const from = { fullPath: '/' }

  beforeEach(() => {
    vi.clearAllMocks()
    authStore.isAuthenticated = true
    authStore.isInitialized = true
    authStore.user = null
  })

  it('requireCompleteProfile manda para ProfileSetup se phone estiver ausente (cadastro torna phone opcional)', async () => {
    authStore.user = { name: 'João', email: 'joao@email.com' }

    await requireCompleteProfile(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'ProfileSetup',
      query: { redirect: '/dashboard' }
    })
  })

  it('requireCompleteProfile libera quando name, email e phone existem', async () => {
    authStore.user = {
      name: 'João',
      email: 'joao@email.com',
      phone: '(11) 99999-9999'
    }

    await requireCompleteProfile(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('requireEmailVerified redireciona se emailVerified for falso', async () => {
    authStore.user = { email: 'joao@email.com', emailVerified: false }

    await requireEmailVerified(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'EmailVerification',
      query: { redirect: '/dashboard' }
    })
  })

  it('requirePermission sem initialize manda para Login quando user ainda é null', async () => {
    authStore.isAuthenticated = false
    authStore.isInitialized = false
    authStore.user = null

    await requirePermission('manage-brokers')(to, from, next)

    expect(authStore.initialize).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/dashboard' }
    })
  })
})
