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

import { requireCompleteProfile } from '@/middleware/auth'

describe('requireCompleteProfile — whitespace é tratado como preenchido', () => {
  const next = vi.fn()
  const to = { fullPath: '/dashboard' }
  const from = { fullPath: '/' }

  beforeEach(() => {
    vi.clearAllMocks()
    authStore.isAuthenticated = true
    authStore.user = null
  })

  it('name/email/phone só com espaços passam no every() e liberam a rota protegida', async () => {
    authStore.user = {
      name: '   ',
      email: '   ',
      phone: '   '
    }

    await requireCompleteProfile(to, from, next)

    expect(next).toHaveBeenCalledWith()
    expect(next).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ProfileSetup' })
    )
  })

  it('string vazia continua incompleta — só o espaço muda o destino', async () => {
    authStore.user = {
      name: 'João',
      email: 'joao@email.com',
      phone: ''
    }

    await requireCompleteProfile(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'ProfileSetup',
      query: { redirect: '/dashboard' }
    })
  })
})
